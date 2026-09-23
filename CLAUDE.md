# CLAUDE.md

File này hướng dẫn Claude Code (và bất kỳ ai code tiếp) khi làm việc trong repo này. Cấu trúc tham khảo từ `util4dev-wiki-service` (xem `websource` cuối file gốc của họ), điều chỉnh lại cho đúng stack và hiện trạng thật của IT_JOB — không copy máy móc phần nào không khớp thực tế.

## Project Overview

IT_JOB — nền tảng tuyển dụng IT (job board): candidate nộp CV, company đăng job và duyệt CV. Backend Spring Boot cung cấp REST API cho Frontend React.

## Tech Stack

- Backend: Java 17 + Spring Boot 3.5.5, MariaDB + Spring Data JPA, Spring Security + JWT (access + refresh token), Bucket4j (rate limit — vẫn in-memory, xem "Còn nợ" cuối file), Redis (read-through cache, xem phần Redis Caching Framework)
- Frontend: React + Vite, Tailwind CSS 4
- Build: Maven (backend), npm (frontend)

## Build Commands

```bash
# Backend — chạy trong Backend/demo
./mvnw clean install
./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=ClassName
./mvnw test -Dtest=ClassName#methodName
./mvnw package -DskipTests

# Frontend — chạy trong Frontend/itjob
npm install
npm run dev
```

Backend chạy ở `localhost:8080`, Frontend ở `localhost:5173`. Backend cần MariaDB thật để chạy (đọc kết nối từ `.env`, không commit); Redis là optional theo thiết kế — app vẫn chạy đúng nếu Redis không sẵn sàng, chỉ mất phần cache (xem Redis Caching Framework).

## Architecture

```
Backend/demo/src/main/java/com/example/demo/
├── controller/      # REST endpoints (@RestController) — chỉ xử lý HTTP
├── services/        # Business logic — interface + services/impl/*Impl
├── repository/      # Spring Data JPA + JpaSpecificationExecutor
│   └── specification/  # JPA Specification cho filter phức tạp (JobSpecification)
├── model/           # JPA @Entity
├── dto/
│   ├── request/     # *Request
│   └── response/     # *Response
├── enums/           # Enum domain (CVStatus, UserRole, JobPosition...)
├── constants/       # Hằng số & enum hạ tầng (không phải domain) — xem "Constants" dưới
├── exception/       # Custom exception + GlobalExceptionHandler
├── config/          # SecurityConfig, filter/ (JWT, rate limit)
└── redis/           # Redis caching framework — xem "Redis Caching Framework" dưới
    ├── core/        # Framework tái sử dụng, không biết entity cụ thể nào
    │   ├── annotation/   # @RedisEntity, @RedisIndexed, @RedisId, @LinkedJpaEntity...
    │   ├── entity/       # BaseRedisEntity
    │   ├── repository/   # RedisCrudRepository, RedisJpaRepository, AbstractRedisRepository
    │   ├── sync/         # DbSyncService, SyncRecoveryService, SyncTask, SyncCallback
    │   ├── config/       # RedisCoreConfig (RedisTemplate, ObjectMapper riêng cho Redis)
    │   └── exception/    # RedisEntityNotFoundException, RedisSyncException...
    ├── entity/      # Redis entity cụ thể (hiện có: JobRedis)
    └── repository/  # Redis repository cụ thể (hiện có: JobRedisRepository)
```

### Layer Responsibilities

**Controller** — HTTP layer only. Nhận request, validate với `@Valid`, gọi service, trả response. Không parse/convert logic, không tự ráp DTO từ 2 service khác nhau (đẩy vào service).

**Service** — toàn bộ business logic. `@Transactional` cho mọi method có write. Convert Entity ↔ DTO — controller không được trả raw Entity ra ngoài (luôn qua `*Response` DTO, xem "API Response").

**Repository** — chỉ data access. Extend `JpaRepository<Entity, Long>` (+ `JpaSpecificationExecutor` khi cần filter động). `@EntityGraph` cho mọi query trả list/single có field quan hệ, để tránh N+1.

### Data Flow

```
Request → Controller → Service (DTO ↔ Entity, business rule) → Repository → MariaDB
                                        ↓ (đọc, entity có Redis cache — hiện chỉ Job)
                                  RedisXxxRepository → Redis (cache miss → JPA repo → tự cache lại)
```

## Entity Design Rule (quyết định riêng của IT_JOB — khác wiki-service)

Wiki-service cấm hoàn toàn JPA relationship annotation (chỉ lưu UUID FK thô). IT_JOB đi hướng ngược lại từ commit `870c4e3` (dùng `@ManyToOne(fetch = LAZY)` + `@EntityGraph` để tránh N+1) — **giữ nguyên hướng này**.

Quy tắc phân biệt:

1. FK trỏ tới **entity nhỏ, gần như bất biến, đóng vai trò lookup/reference table** (ví dụ `Location` — chỉ 2 field, vài chục dòng) → cho phép `@ManyToOne(fetch = FetchType.LAZY)` + `@JoinColumn`, **bắt buộc** có `@EntityGraph(attributePaths = {...})` ở mọi repository method dùng field đó.
2. FK trỏ tới **aggregate root / entity nghiệp vụ lớn, thay đổi thường xuyên** (ví dụ `Account`) → luôn raw ID (`Long`), **không bao giờ** dùng relationship. Load kèm data khi cần thì batch ở service layer (`UserService.getUsersByIds`).
3. `Job.companyID` (raw) và `Job.location` (relation) là 2 loại FK khác bản chất theo đúng 2 quy tắc trên — không phải bug.
4. Mọi `@ManyToOne`/`@OneToMany` phải `fetch = FetchType.LAZY`.

## Redis Caching Framework

Mirror kiến trúc Redis của `util4dev-wiki-service` (annotation-driven, generic qua reflection), điều chỉnh 2 điểm khác biệt với MariaDB/entity của IT_JOB:

1. **UPSERT trong `DbSyncService`** dùng cú pháp MariaDB (`INSERT ... ON DUPLICATE KEY UPDATE`) thay vì Postgres `ON CONFLICT ... DO UPDATE`.
2. **`Job.id` sinh bởi DB sequence**, không phải UUID client-generatable như entity mẫu của wiki-service (`Document`, `Workspace`...). Vì vậy `JobRedis` dùng `SyncStrategy.CACHE_ONLY` + `autoSync = false`: Redis chỉ là cache đọc (read-through), **MariaDB qua `JobRepository`/`JobServiceImpl` vẫn là nơi ghi duy nhất** — không dùng WRITE_BEHIND/WRITE_THROUGH cho `Job`. Lý do thêm: `Job.tags`/`Job.images` là `@ElementCollection` (bảng con riêng `job_tags`/`job_images`), UPSERT 1-bảng generic của `DbSyncService` không xử lý đúng trường hợp này — **chỉ dùng WRITE_BEHIND/WRITE_THROUGH cho entity map phẳng vào 1 bảng, không có `@ElementCollection`/`@OneToMany`.**

### Cách thêm 1 Redis entity mới (theo pattern `JobRedis`/`JobRedisRepository`)

1. Entity: `extends BaseRedisEntity<ID>`, gắn `@RedisEntity(value = "prefix", timeToLive = giây, syncStrategy = ...)` + `@LinkedJpaEntity(JpaEntity.class)`, field nào cần query theo thì gắn `@RedisIndexed`. Dùng `@Data` (Lombok) — KHÔNG override `getId()/setId()` tay, để Lombok sinh từ field `id` (trùng signature abstract method của `BaseRedisEntity`, override tay sẽ đụng lỗi duplicate method).
2. Repository: `extends AbstractRedisRepository<XxxRedis, ID>`, implement `generateId()` (nếu ID sinh bởi DB sequence thì `throw new UnsupportedOperationException(...)` — entity phải luôn tạo từ bản ghi DB đã lưu), `loadFromDb(id)` (gọi JPA repository), override `convertId()` nếu ID không phải String.
3. Nếu muốn WRITE_BEHIND/WRITE_THROUGH thật (entity map phẳng, không `@ElementCollection`): đảm bảo `@Column`/`@Table` trên JPA entity đủ để `DbSyncService` build đúng UPSERT — test kỹ trước khi bật, vì đây là native SQL.
4. Ở service layer ghi dữ liệu (create/edit/delete qua JPA như bình thường), gọi thêm `xxxRedisRepository.save(XxxRedis.fromJpaEntity(saved))` hoặc `.deleteById(id)` ngay sau khi JPA write thành công, để cache không bị stale.

### ⚠️ KHÔNG dùng Redis-cached read (`getCachedXxxResponse`) ở nơi cần entity JPA-managed để tiếp tục mutate/save

`JobService.getJobByID(Long id)` (JPA-managed, dùng cho `CVServiceImpl.addCV` tăng `appliedCount` — dựa vào Hibernate dirty-checking tự flush khi transaction commit, KHÔNG có `.save()` tường minh) và `JobService.getCachedJobResponse(Long id)` (đọc qua `JobRedisRepository`, dùng cho `JobController.getJobInfo` — endpoint đọc thuần) **phải tách riêng, không gộp** — nếu đổi `getJobByID` sang đọc qua Redis, object trả về là detached (không phải entity JPA-managed), mutate nó sẽ KHÔNG được lưu xuống DB, mất dữ liệu âm thầm.

### Cấu hình

`spring.data.redis.*` trong `application.properties`, đọc từ env (`REDIS_HOST`, `REDIS_PORT`...). `RedisCoreConfig.redisObjectMapper()` là bean `ObjectMapper` RIÊNG cho Redis (JSON thuần, không nhúng type metadata) — **không** đánh `@Primary` (ObjectMapper mặc định của Spring Boot cho JSON response REST API vẫn giữ primary), mọi nơi cần bean này phải `@Qualifier("redisObjectMapper")` tường minh.

## Constants

Package `constants/` — hằng số/enum **hạ tầng** (không phải domain rule, khác `enums/`): `SecurityConstants` (header/cookie name), `RateLimitConstants` (Bucket4j capacity/limit type), `RedisConstants`/`SyncConstants`/`SyncStrategy`/`SyncOperation` (Redis framework). Thêm hằng số mới vào đây thay vì để string/số magic rải trong code — đã dọn ở `RateLimitingFilter`, `JwtAuthenticationFilter`, `AuthController`, xem các file đó làm ví dụ.

## Coding Standards

### SOLID (bắt buộc)

- **S**: Controller chỉ xử lý HTTP, Service chỉ chứa business logic của 1 domain. Service > 200 dòng → tách nhỏ.
- **O**: Mở rộng qua interface/composition, không sửa code cũ đang chạy tốt.
- **L**: Subclass/implementation phải thay thế được parent mà không phá logic.
- **I**: Interface nhỏ, tập trung 1 mục đích.
- **D — BẮT BUỘC**: Controller/Service khác chỉ inject qua **interface**, không inject trực tiếp `*Impl`. `TfIdfRecommender` đã tách interface `JobRecommender` — `JobController` inject `JobRecommender`, không phải class cụ thể; thêm cách recommend khác (embedding-based, ROADMAP Phase 4.5) chỉ cần thêm implementation mới.

### Naming Conventions

- Package: lowercase, không underscore.
- Class/Interface: PascalCase danh từ, interface không prefix `I`, implementation suffix `Impl`.
- Method: camelCase, bắt đầu bằng động từ, boolean method dùng `is*/has*/can*`.
- Variable: camelCase có nghĩa, không viết tắt khó hiểu, collection dùng số nhiều.
- Constant: SCREAMING_SNAKE_CASE, đặt trong `constants/`.
- DTO: `Create*Request`/`Edit*Request` khi tạo/sửa, `*Response` khi trả ra, `*Filter`/`*Query` khi search/filter.

### Clean Code Rules

- Method tối đa ~20 dòng, quá dài thì tách (ví dụ `JobServiceImpl.applyEditFields` tách ra từ `editJob`).
- Method tối đa 3 tham số, nhiều hơn thì gói vào object/DTO.
- Không catch generic `Exception` trừ khi thật cần (GlobalExceptionHandler catch `Exception.class` ở tầng cuối là safety net, không phải nơi xử lý logic).
- Không return `null` — dùng `Optional` hoặc throw exception.
- Comment: code tự giải thích, hạn chế comment, chỉ giải thích WHY khi không hiển nhiên.

### Google Java Style (áp dụng dần cho code mới, không bắt sửa lại toàn bộ code cũ)

- `final` cho method parameter/local variable không đổi giá trị.
- Luôn dùng `this.` khi truy cập field/method của instance.
- Indentation nhất quán 4 spaces, không mix tab/space.
- Luôn dùng `{}` cho if/for/while kể cả 1 dòng. Không dùng wildcard import.
- Ưu tiên `for` loop ở phần xử lý nóng (batch mapping N+1), Stream OK cho code đơn giản.

### Exception Hierarchy (đầy đủ 5 loại, mirror wiki-service)

| Exception | HTTP | Dùng khi |
|---|---|---|
| `ResourceNotFoundException` | 404 | Không tìm thấy resource. Có 2 constructor: `(message)` cho code cũ, `(resourceName, fieldName, fieldValue)` cho code mới — tự format message thống nhất. |
| `BadRequestException` | 400 | Input/format sai không phải lỗi validate bean (`@Valid`). |
| `BusinessException` | 409 Conflict | Trạng thái xung đột (ví dụ: đã ứng tuyển job này rồi) — input hợp lệ nhưng data hiện tại không cho phép. |
| `AccessDeniedException` (custom, `com.example.demo.exception`) | 403 | Ownership check thất bại trong service (ví dụ company A xoá job của company B) — khác Spring Security's `AccessDeniedException` (role/`@PreAuthorize` check, cũng map 403 nhưng ở tầng khác). `GlobalExceptionHandler` có 2 handler riêng, phân biệt bằng fully-qualified name (2 class cùng simple name). |
| `UnauthorizedException` | 401 | Xác thực thất bại ở business logic (ví dụ refresh token hết hạn/revoked/reuse detected — xem `RefreshTokenServiceImpl`). |

Riêng exception của Redis framework (`redis.core.exception.*`) KHÔNG map trong `GlobalExceptionHandler` — rơi vào handler `Exception.class` chung (500), giống hệt cách wiki-service làm (những exception này phản ánh lỗi hạ tầng cache, không phải lỗi nghiệp vụ cần trả message rõ cho client).

### Transactional Consistency (BẮT BUỘC)

Mọi method service có write (save/update/delete) phải có `@Transactional`.

### N+1 Query Prevention (QUAN TRỌNG)

Không query trong loop, đặc biệt không query trong **comparator/sort**. Batch load bằng `findAllById(...)` thành `Map<ID, Entity>`, map DTO từ map đó — không gọi lại repository/service trong loop. Xem `UserService.getUsersByIds`, `JobService.toCardList`, `CVService.toDTOList` làm ví dụ đã fix.

## Service & Controller Template

```java
public interface JobService {
    Job createJob(JobCreationRequest request, CompanyResponse company);
    Optional<Job> getJobByID(Long id);
}

@Service
@RequiredArgsConstructor
@Slf4j
public class JobServiceImpl implements JobService {
    private final JobRepository jobRepository;

    @Override
    @Transactional
    public Job createJob(JobCreationRequest request, CompanyResponse company) {
        // validate → build entity → save → log → return
    }
}

@RestController
@RequiredArgsConstructor
@RequestMapping("/jobs")
@Slf4j
public class JobController {
    private final JobService jobService;

    @PostMapping
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<ApiResponse<JobResponse>> create(@Valid @RequestBody JobCreationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(jobService.toResponse(jobService.createJob(...))));
    }
}
```

## API Response — chuẩn hoá bằng `ApiResponse<T>`

Mọi controller trả `ResponseEntity<ApiResponse<T>>` — [`ApiResponse.java`](Backend/demo/src/main/java/com/example/demo/dto/response/ApiResponse.java) dạng `{ success, data, message, timestamp }`. `GlobalExceptionHandler` trả cùng shape (`success=false, data=null, message=...`).

Quy ước:
- Có payload thật → `ApiResponse.success(data)`.
- Endpoint chỉ xác nhận hành động (delete, logout...) → `ApiResponse.success(null, "message")`, kiểu trả `ApiResponse<Void>`.
- Không bao giờ để controller trả trực tiếp Entity — luôn qua DTO rồi mới bọc `ApiResponse`.

Frontend: response interceptor ở [`utils/api.ts`](Frontend/itjob/src/utils/api.ts) tự unwrap `response.data = response.data.data` cho mọi call qua instance `api` chung.

## Còn nợ (chưa làm, biết rõ và có lý do hoãn — không phải bỏ quên)

- **Pagination**: chưa có `Pageable`/`Page<T>` ở backend — list API trả toàn bộ dữ liệu, frontend tự cắt trang. Cần đổi contract response (breaking change FE), để riêng 1 đợt.
- **Rate limiter vẫn in-memory** (`RateLimitingFilter` dùng `ConcurrentHashMap`) — sai nếu chạy nhiều instance. Đã có Redis trong project (dùng cho cache Job) nhưng CHƯA migrate Bucket4j sang Redis backend (`bucket4j-redis`) — làm khi có ý định scale ngang thật.
- **Test tự động**: chỉ có `DemoApplicationTests.contextLoads()` — chưa có test cho N+1 fix, Redis framework, exception mapping. Nên viết trước khi refactor thêm để có lưới an toàn.
- **`company-register` frontend** gọi endpoint yêu cầu `ROLE_ADMIN` — cần quyết định business (mở public hay bỏ flow), xem REFACTOR_PLAN.md.

## Reference Documentation

- [ROADMAP.md](ROADMAP.md) — roadmap tính năng mới ở mức tổng quan (notification đa kênh, Google Calendar, webhook/bot, AI agent, search nâng cấp, scaling)
- [docs/features/](docs/features/README.md) — hướng dẫn triển khai chi tiết từng phase trong ROADMAP.md
- [REFACTOR_PLAN.md](REFACTOR_PLAN.md) — plan dọn code hiện tại theo rule ở file này, có ưu tiên và file:line cụ thể
