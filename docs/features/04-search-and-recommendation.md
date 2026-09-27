# Phase 4 — Search & Recommendation Upgrade

## Mục tiêu

Nâng cấp search hiện tại (JPA Specification + `LIKE`) và recommendation hiện tại (`TfIdfRecommender` tính real-time mỗi request) lên nhanh hơn, thông minh hơn, và thêm Job Alert (tính năng nối Search + Notification + Scheduler thành 1 flow hoàn chỉnh).

## Điều kiện tiên quyết

- 4.1 (fulltext) — không phụ thuộc phase nào, làm được ngay.
- 4.2 (cache TF-IDF) — cần Phase 6.1 (Redis).
- 4.4 (Job Alert) — cần Phase 1 (Notification) + Phase 6.2 (Scheduler).
- 4.5 (semantic embedding) — không phụ thuộc phase khác, nhưng nên làm sau 4.1/4.4 vì độ khó cao hơn.

## Bước 1 — 4.1. MariaDB FULLTEXT index

Hiện tại [`JobSpecification.java`](../../Backend/demo/src/main/java/com/example/demo/repository/specification/JobSpecification.java) dùng `cb.like(cb.lower(root.get("name")), "%keyword%")` — chậm dần khi bảng `jobs` lớn (không dùng được index cho `LIKE '%x%'`).

1. Migration thêm FULLTEXT index:
   ```sql
   ALTER TABLE jobs ADD FULLTEXT INDEX ft_jobs_name_description (name, description);
   ```
2. Query native thay cho Specification `LIKE` khi có `query` param:
   ```java
   @Query(value = "SELECT * FROM jobs WHERE MATCH(name, description) AGAINST (:keyword IN NATURAL LANGUAGE MODE)",
          nativeQuery = true)
   List<Job> searchByFulltext(@Param("keyword") String keyword);
   ```
   **Vấn đề cần giải quyết:** query native trả `List<Job>` không kết hợp được trực tiếp với `Specification` (filter theo location/position/salary/tags vẫn cần). Cách xử lý: 2 bước — (a) fulltext query chỉ lấy `List<Long> matchingJobIds` (`SELECT id FROM jobs WHERE MATCH(...)`), (b) đưa `matchingJobIds` vào `Specification` hiện có như 1 predicate `root.get("id").in(matchingJobIds)`. Giữ được toàn bộ logic filter khác không phải viết lại.
3. Nếu `query` param rỗng, giữ nguyên logic Specification cũ (không phải mọi search đều cần fulltext, chỉ cần khi có từ khoá).

## Bước 2 — 4.3. Geo-search

`Job` đã có `Location` (relation, theo Entity Design Rule — bảng lookup nhỏ). 2 mức độ:
- **Đơn giản (đủ dùng ngay)**: filter theo tỉnh/thành — đã có sẵn qua `JobFilterRequest.location` (lọc theo `abbreviation`), không cần thêm gì.
- **Nâng cao (bán kính km)**: cần thêm `latitude`/`longitude` vào `Location` (hoặc vào `Job.address` nếu muốn geo theo địa chỉ cụ thể công ty, chính xác hơn theo tỉnh/thành). Query khoảng cách bằng công thức Haversine trong native SQL, hoặc dùng MariaDB's `ST_Distance_Sphere` nếu cột kiểu `POINT` (MariaDB có hỗ trợ spatial type). Chỉ làm mức này khi có yêu cầu thật — mức đơn giản đã đủ giá trị cho hầu hết use case tuyển dụng VN (ứng viên tìm theo tỉnh/thành, không theo bán kính km).

## Bước 3 — 4.4. Saved Search / Job Alert

### Entity `SavedSearch`

```java
@Entity
@Table(name = "saved_searches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SavedSearch {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false)
    private Long accountId;

    // Lưu lại đúng field JobFilterRequest — tái sử dụng, không tạo DTO song song
    private String query;
    private String location;
    @ElementCollection private List<String> position;
    @ElementCollection private List<String> workstyle;
    private Integer minSalary;
    private Integer maxSalary;
    @ElementCollection private List<String> tags;

    private Instant lastNotifiedAt;   // để scheduled job biết chỉ báo job MỚI từ lần check trước
    @CreationTimestamp private Instant createdAt;
}
```

### API

```
POST   /saved-searches          — lưu filter hiện tại (từ trang search, nút "Lưu tìm kiếm này")
GET    /saved-searches          — list của user
DELETE /saved-searches/{id}
```

### Scheduled job (chi tiết đầy đủ ở Phase 6.2, tóm tắt luồng ở đây)

```java
@Component
@RequiredArgsConstructor
public class JobAlertScheduledTask {
    @Scheduled(cron = "0 0 8 * * *")   // 8h sáng mỗi ngày
    public void checkNewMatchingJobs() {
        for (SavedSearch saved : savedSearchRepository.findAll()) {
            JobFilterRequest filter = toFilterRequest(saved);
            List<Job> matches = jobRepository.findAll(JobSpecification.withFilters(filter))
                .stream()
                .filter(j -> j.getCreatedAt().isAfter(saved.getLastNotifiedAt()))
                .toList();
            if (!matches.isEmpty()) {
                eventPublisher.publishEvent(new JobAlertEvent(saved.getAccountId(), matches.stream().map(Job::getId).toList()));
                saved.setLastNotifiedAt(Instant.now());
                savedSearchRepository.save(saved);
            }
        }
    }
}
```
`JobAlertEvent` là event mới (thêm vào package `event/` từ Phase 0), `NotificationEventListener` (Phase 1) lắng nghe thêm case này, dùng `NotificationEventType.JOB_ALERT`.

**Lưu ý hiệu năng:** nếu số `SavedSearch` lớn, lặp qua `findAll()` rồi query riêng mỗi cái là N query — chấp nhận được ở quy mô vừa (chạy 1 lần/ngày, không phải hot path), nhưng nếu sau này scale lớn, xem xét batch theo filter giống nhau hoặc chuyển sang 1 query tổng hợp.

## Bước 4 — 4.5. Semantic search bằng embedding

**Vấn đề của TF-IDF hiện tại**: `TfIdfRecommender` so khớp từ vựng chính xác — "Java Developer" và "Backend Engineer" không có từ chung nào nên tương đồng = 0, dù về nghĩa là gần nhau.

### Lựa chọn embedding model

- **API-based** (đơn giản, không cần hạ tầng ML riêng): OpenAI `text-embedding-3-small`, hoặc Gemini `embedding-001` — gọi REST, trả vector ~768-1536 chiều.
- **Self-hosted** (không tốn phí API nhưng cần chạy model): `all-MiniLM-L6-v2` qua Python service riêng (Java không có ecosystem embedding model tốt như Python) — **phức tạp hơn nhiều** vì phải chạy thêm 1 service Python cạnh Spring Boot. Chỉ chọn hướng này nếu volume quá lớn khiến chi phí API không chịu được.

Khuyến nghị: bắt đầu với API-based, đơn giản, đủ dùng ở quy mô hiện tại.

### Lưu trữ vector

MariaDB **không có** vector type/index chuyên dụng (khác PostgreSQL có `pgvector`). 2 lựa chọn:
- **Lưu JSON array trong 1 cột `TEXT`** (`Job.embeddingVector`), tính cosine similarity **trong Java** (giống `TfIdfRecommender` hiện tại đang làm) — đơn giản, không cần hạ tầng mới, nhưng O(n) mỗi lần tính (chấp nhận được nếu số job không quá lớn, ví dụ dưới vài chục nghìn).
- **Thêm vector DB riêng** (Qdrant, Milvus, hoặc Elasticsearch với dense_vector) — chỉ làm khi (1) đã quá số lượng job mà tính tay trong Java chậm rõ rệt, VÀ (2) đã đo được đây là bottleneck thật (không đoán trước). Thêm 1 hệ thống mới luôn có chi phí vận hành — đừng làm trước khi cần.

### Implement (hướng đơn giản, JSON column)

1. Thêm cột `embedding_vector TEXT` vào `jobs` (migration).
2. `EmbeddingService` (interface + implementation gọi OpenAI/Gemini):
   ```java
   public interface EmbeddingService {
       double[] embed(String text);
   }
   ```
3. Khi job được tạo/sửa (`JobServiceImpl.createJob`/`editJob`), gọi `embeddingService.embed(job.getName() + " " + job.getDescription() + " " + tags)` → lưu vào `embeddingVector` (serialize JSON qua Jackson).
4. `EmbeddingJobRecommender implements JobRecommender` (tách interface `JobRecommender` khỏi `TfIdfRecommender` — đây chính là lúc CLAUDE.md dự kiến làm việc này, xem mục 10 trong REFACTOR_PLAN.md) — song song tồn tại với `TfIdfRecommender`, chọn qua config hoặc A/B test, KHÔNG xoá TF-IDF ngay (embedding tốn phí API mỗi lần embed, TF-IDF miễn phí — có thể vẫn muốn dùng TF-IDF cho trường hợp đơn giản/free tier).

### Recompute theo lịch

Job description hiếm khi đổi sau khi tạo — không cần recompute định kỳ cho job cũ, chỉ compute 1 lần khi tạo/sửa là đủ (khác với gợi ý "6.2 recompute theo lịch" ở ROADMAP.md ban đầu — sau khi thiết kế chi tiết, nhận ra recompute định kỳ chỉ cần thiết nếu đổi **model** embedding, không cần cho data không đổi. Nếu đổi model embedding sau này, chạy 1 lần script backfill toàn bộ, không cần scheduled job thường trực).

## Config cần thêm

```properties
app.embedding.provider=${EMBEDDING_PROVIDER:openai}
app.embedding.api-key=${EMBEDDING_API_KEY:}
app.embedding.model=${EMBEDDING_MODEL:text-embedding-3-small}
```

## Testing checklist

- [ ] Test fulltext search trả kết quả đúng với từ khoá có dấu tiếng Việt (MariaDB FULLTEXT mặc định dùng ngôn ngữ tự nhiên tokenizer — kiểm tra kỹ với tiếng Việt vì có thể không tách từ đúng như tiếng Anh, cần test thật với data tiếng Việt trước khi tin tưởng).
- [ ] Test `JobAlertScheduledTask` — tạo `SavedSearch`, tạo job mới khớp filter, chạy job thủ công (gọi method trực tiếp trong test, không chờ cron), verify `JobAlertEvent` được publish đúng 1 lần và không lặp lại ở lần chạy kế tiếp (nhờ `lastNotifiedAt`).
- [ ] Unit test cosine similarity cho embedding — dùng vector cố định, verify kết quả tính đúng công thức.
- [ ] Test chi phí: log số lần gọi `EmbeddingService.embed()` mỗi ngày trong giai đoạn thử nghiệm, so với ngân sách API dự kiến trước khi bật cho toàn bộ job thật.

## Definition of Done

- [ ] Search với từ khoá nhanh hơn rõ rệt so với `LIKE` khi test với data lớn (so sánh EXPLAIN query trước/sau).
- [ ] Candidate lưu được Saved Search, nhận được thông báo (qua Notification system Phase 1) khi có job mới khớp, không bị báo trùng job đã báo rồi.
- [ ] (Nếu làm 4.5) Recommendation embedding-based cho ra kết quả hợp lý hơn TF-IDF cho ít nhất vài ví dụ test tay (ví dụ "Java Developer" match được job "Backend Engineer" có tags Java).

## Rủi ro / lưu ý

- FULLTEXT index tiếng Việt có thể không hoạt động tốt như tiếng Anh (MariaDB fulltext tokenizer không chuyên cho tiếng Việt) — nếu kết quả kém, cân nhắc thêm Elasticsearch/OpenSearch (có phân tích tiếng Việt tốt hơn qua ICU tokenizer) thay vì cố ép MariaDB fulltext — nhưng đó là quyết định lớn (thêm hạ tầng mới), chỉ làm khi FULLTEXT thật sự không đủ dùng.
- Đừng gọi Embedding API đồng bộ trong request tạo job (làm chậm response) — publish 1 event `JobCreatedEvent` (đã có từ Phase 0), 1 listener riêng tính embedding async.
