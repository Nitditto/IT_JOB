# IT_JOB — Refactor Plan

Plan dọn code hiện tại để khớp với [CLAUDE.md](CLAUDE.md). Dựa trên đọc trực tiếp code hiện tại (không suy đoán), có file:line cụ thể. Các mục đã fix được đánh dấu ✅ — giữ trong file để làm lịch sử/tra cứu, không xoá.

## 🔴 → ✅ Frontend gọi sai gần như toàn bộ endpoint Backend — ĐÃ SỬA

Phát hiện: Backend đã rewrite RESTful ở commit `f96d456` nhưng Frontend chưa từng được cập nhật theo — gần 30 file gọi sai path (`/job/get/:id` thay vì `/jobs/:id`, `/company/list` thay vì `/companies`, `/edit/user` thay vì `/users/me`...), cộng thêm ~20 file gọi `axios` trực tiếp tới `${BACKEND_URL}` — biến đọc từ `import.meta.env.VITE_BACKEND_URL` mà `.env.example` không hề khai báo (luôn là `undefined`).

**Đã sửa toàn bộ** (~28 file) trong lượt này: đổi hết endpoint cho khớp REST route thật của Backend (đối chiếu từng controller: `JobController`, `CVController`, `UserController`, `AuthController`, `LocationController`), và **chuyển toàn bộ `axios` trực tiếp sang dùng instance `api` chung** (`utils/api.ts`) — vừa fix path vừa tự động có JWT header, CSRF, và unwrap `ApiResponse<T>` qua interceptor.

**Bonus phát hiện + sửa luôn trong lúc đối chiếu field-by-field với DTO Backend** (không chỉ path mà cả field name):
- [`job/page.tsx`](Frontend/itjob/src/pages/job/page.tsx): đọc `infoCompany.overtime` nhưng `CompanyResponse` field thật là `hasOvertime` → luôn hiện sai; đã sửa. Cũng giới hạn check "đã nộp CV chưa" chỉ chạy khi `role === 'ROLE_USER'` (trước đây chạy cho mọi role đã login, sẽ 403 vô ích với company/admin).
- [`RecommendedJobs.tsx`](Frontend/itjob/src/components/section/RecommendedJobs.tsx): dùng field `company` không tồn tại trên `JobCardResponse` (thật ra là `companyName`) → tên công ty luôn hiện trống; đã sửa.
- [`company/job/page.tsx`](Frontend/itjob/src/pages/dashboard/company/job/page.tsx): sau khi xoá job thì `navigate("/")` **rồi mới** gọi `fetchJobs()` — điều hướng đi trước khi data kịp fetch, vô nghĩa; đã bỏ `navigate`, chỉ giữ `fetchJobs()` để refresh đúng trang danh sách.
- Cập nhật CV status (company duyệt CV) ở 2 file (`company/cv/list`, `company/cv/detail`) gọi sai cả path (`/cv/company/status/...`) **và** sai HTTP method (`PUT` thay vì `PATCH`) — đã sửa cả hai.
- Toàn bộ chỗ hiển thị lỗi (`error.response?.data`) đổi thành `error.response?.data?.message` cho khớp shape `ApiResponse` mới (trước đây hiển thị cả object lỗi dạng `[object Object]`).

**Môi trường dev cũng bị hỏng sẵn:** `node_modules` thiếu `framer-motion` (có khai trong `package.json` nhưng chưa từng `npm install` sau khi thêm) — chạy `npm install` đã fix, verify bằng cách chạy thật `npm run dev` (port 5183, không đụng port 5173 đang có server khác) và load trang chủ thành công, Network tab xác nhận request đi đúng `/api/jobs/count`, `/api/companies`, `/api/csrf`... (đúng path Backend RESTful).

**Không thể test hết end-to-end**: Backend cần MariaDB thật (`spring.datasource.url` đọc từ `.env` không có trong sandbox này, không có Docker/MariaDB cài sẵn) — đã xác nhận `mvnw spring-boot:run` fail đúng ở bước kết nối DataSource (không phải lỗi do code). Cần bạn tự chạy full stack (có DB) để smoke-test lại — ưu tiên: đăng nhập, tìm việc, nộp CV, công ty duyệt CV.

**Vấn đề khác phát hiện, KHÔNG sửa vì cần bạn quyết định (không phải lỗi path):**
- [`company-register/page.tsx`](Frontend/itjob/src/pages/company-register/page.tsx): trang public tự đăng ký công ty gọi `POST /auth/register/company` — nhưng endpoint này yêu cầu `@PreAuthorize("hasRole('ADMIN')")`. Trang sẽ luôn nhận 403 vì user public không đăng nhập. Có 2 hướng: (a) mở public endpoint này, hoặc (b) bỏ hẳn flow tự đăng ký, chỉ để admin tạo tài khoản công ty qua [dashboard/admin/register](Frontend/itjob/src/pages/dashboard/admin/register/page.tsx) (trang này đã đúng, gọi đúng endpoint sẵn). Đã ghi rõ comment trong code, chưa tự chọn thay bạn.
- Trang chủ có lỗi 403 riêng từ Gemini API (`GoogleGenerativeAI Error... API key reported as leaked`) khi test — không liên quan gì tới việc sửa endpoint, là API key bị lộ/revoke, cần bạn tự cấp lại key mới trong `.env` của Frontend.

---

## Tóm tắt hiện trạng (để biết cái gì ĐÃ tốt, không cần đụng)

Project đã tự refactor khá nhiều trước đó (xem git log): DTO tách request/response (`d38bb5e`), service tách interface/impl (`e7a0a73`), EntityGraph + Specification chống N+1 ở tầng repository (`870c4e3`), controller RESTful + bỏ try-catch (`f96d456`), global exception handler (`795b8fa`). Những phần này **đã đúng chuẩn**, không làm lại.

---

## P0 — Bảo mật

### 1. ✅ ĐÃ FIX — CORS cho phép mọi origin + gửi credentials
Đọc `@Value("${allowed.cors.origins}")` thay cho hardcode `"*"` trong [SecurityConfig.java](Backend/demo/src/main/java/com/example/demo/config/SecurityConfig.java).

### 2. ✅ ĐÃ FIX — Cookie `secure(false)` hardcode, lặp 3 lần
Gộp thành helper `buildRefreshTokenCookie(...)` trong [AuthController.java](Backend/demo/src/main/java/com/example/demo/controller/AuthController.java), đọc cờ qua `app.cookie.secure`.

---

## P1 — Bug/thiếu nhất quán

### 3. ✅ ĐÃ FIX — `CVServiceImpl.editCV` thiếu `@Transactional`

### 4. ✅ ĐÃ FIX — N+1 khi sort company theo số lượng job
Thêm `JobRepository.countByCompanyIds(...)` (1 query group-by) thay cho query trong comparator.

### 5. ✅ ĐÃ FIX — N+1 khi map Job/CV list sang DTO
Thêm `UserService.getUsersByIds(...)` batch dùng chung; `JobService.toCard` (single) bỏ hẳn, thay `toCardList`; `CVService` thêm `toDTOList` cho 2 endpoint trả list. `TfIdfRecommender` cũng được sửa N+1 tương tự + sort/limit trước khi build card.

### 6. ✅ ĐÃ FIX — Entity trả trực tiếp ra controller
Thêm [`JobResponse`](Backend/demo/src/main/java/com/example/demo/dto/response/JobResponse.java) + `JobService.toResponse(Job)`. `JobController.create`/`getJobInfo`/`editJob` giờ trả `JobResponse`, không còn leak entity `Job` ra API.

### 7. ✅ ĐÃ FIX — Biến đặt tên trùng tên type
`AccountResponse AccountResponse` → `accountResponse` trong `AuthController`.

### 8. ✅ ĐÃ FIX — Controller tự parse Enum từ String
`CVController.updateStatus` đổi `@RequestParam CVStatus status`, để Spring tự convert + tự trả 400 (thêm handler `MethodArgumentTypeMismatchException` trong `GlobalExceptionHandler` để trả message rõ ràng thay vì rơi vào lỗi 500 chung).

---

## P2 — Kiến trúc

### 9. ✅ ĐÃ XEM LẠI — FK `companyID` (raw) vs `location` (relation) trong `Job` — KHÔNG PHẢI BUG, không đổi code

Bản plan đầu flag đây là "không nhất quán" và đề xuất đổi `location` thành raw string. Sau khi xem lại kỹ (đối chiếu `Location` entity — chỉ 2 field, bảng lookup nhỏ, gần như bất biến — với `Account` — aggregate root lớn, đổi thường xuyên), nhận ra đây là 2 loại FK khác bản chất, không phải cùng 1 loại bị làm 2 cách:

- FK tới lookup table nhỏ (`Location`) → relation + `@EntityGraph` là đúng, rẻ, không có rủi ro N+1 thật (bảng chỉ vài chục dòng).
- FK tới aggregate root lớn (`Account`) → raw ID + batch load ở service (đã áp dụng ở mục 4, 5).

→ **Không sửa `Job.java`.** Đã formalize quy tắc phân biệt này vào CLAUDE.md phần "Entity Design Rule" để tránh flag nhầm lần sau. Đây là ví dụ cho thấy review đầu tiên đôi khi quá cơ giới (mechanical) — cần đối chiếu bản chất dữ liệu trước khi kết luận "không nhất quán = bug".

### 10. `TfIdfRecommender` không qua interface — vẫn chưa cần
Giữ nguyên đánh giá cũ: chấp nhận được, chỉ tách interface khi có recommend engine thứ 2.

### 11. ✅ ĐÃ FIX — Chuẩn hoá `ApiResponse<T>`

Thêm [`ApiResponse<T>`](Backend/demo/src/main/java/com/example/demo/dto/response/ApiResponse.java) (`success, data, message, timestamp`), áp dụng cho **toàn bộ** controller (`JobController`, `CVController`, `UserController`, `AuthController`, `LocationController`). `GlobalExceptionHandler` cũng trả cùng shape thay cho `ErrorResponse` cũ (đã xoá file `ErrorResponse.java`).

**Xử lý breaking change với Frontend:** thêm response interceptor trong [`utils/api.ts`](Frontend/itjob/src/utils/api.ts) tự unwrap `response.data.data` → code hiện tại đọc `res.data` không cần sửa, **miễn là trang đó gọi qua instance `api` chung**. Không đụng tới ~20 file gọi `axios` trực tiếp — nhóm này đã bị vấn đề nghiêm trọng hơn ở mục 🔴 phía trên (endpoint sai), sửa response shape cho chúng lúc này không có ý nghĩa vì request còn chưa tới đúng endpoint.

---

## P3 — Style

### 12-14. ✅ ĐÃ FIX
Dead code/comment hướng dẫn trong `SecurityConfig`, mixed tab/space indentation, `JobServiceImpl.editJob` quá dài (tách `applyEditFields`).

---

## Còn lại thật sự cần làm (trước đợt dưới)

```
Quyết định hướng cho company-register (mở public endpoint hay bỏ flow tự đăng ký) — xem chi tiết ở trên.
Chạy full stack có MariaDB thật để smoke-test lại toàn bộ flow: đăng ký/login, tìm việc,
nộp CV, công ty duyệt CV, sửa profile — chưa test được trong sandbox này vì thiếu DB.
Cấp lại Gemini API key mới (key cũ bị revoke) nếu muốn dùng các feature AI ở trang chủ/dashboard.
```

Backend: đã compile thành công (`./mvnw clean compile` — BUILD SUCCESS). Frontend: đã type-check sạch (`tsc --noEmit`) và chạy thật được bằng `npm run dev` sau khi `npm install` bổ sung dependency thiếu — xác nhận qua Network tab rằng mọi request giờ đi đúng path RESTful của Backend.

---

## Đợt 2 — Mở rộng theo chuẩn `util4dev-wiki-service` (constants/exception đầy đủ + Redis framework)

Yêu cầu: "refactor toàn bộ những lỗi còn sót, code các phần chưa đủ lớn thì bổ sung chi tiết", đối chiếu code thật của `D:\CODING\wiki-service\util4dev-wiki-service` (không chỉ CLAUDE.md của họ) để mirror pattern `constants/`, `exception/`, và Redis `core/entity/repository` framework.

### 15. ✅ ĐÃ FIX — `TfIdfRecommender` giờ có interface `JobRecommender`
Mục 10 (trước đây để "chưa cần") — làm luôn theo yêu cầu "expand để maintain được". `JobController` inject `JobRecommender`, không phải class cụ thể.

### 16. ✅ ĐÃ FIX — Exception hierarchy đầy đủ 5 loại (mirror wiki-service)
Thêm `BusinessException` (409), `AccessDeniedException` custom (403, phân biệt với Spring Security's cùng tên), `UnauthorizedException` (401). Wire vào chỗ đang dùng sai loại exception:
- `JobServiceImpl.deleteJob` — ownership check: `BadRequestException` → `AccessDeniedException`.
- `CVServiceImpl.addCV` — "đã ứng tuyển rồi": `BadRequestException` → `BusinessException`.
- `RefreshTokenServiceImpl` — token hết hạn/revoked/reuse detected (3 chỗ): `BadRequestException` → `UnauthorizedException`.
`ResourceNotFoundException` thêm constructor `(resourceName, fieldName, fieldValue)` kiểu wiki-service, giữ constructor message cũ cho ~30 chỗ gọi hiện tại.

### 17. ✅ ĐÃ FIX — Package `constants/` mới (7 file)
`SecurityConstants`, `RateLimitConstants` (domain hạ tầng), `RedisConstants`, `SyncConstants`, `SyncStrategy`, `SyncOperation` (cho Redis framework, mục 19). Wire vào `RateLimitingFilter` (bỏ string/số magic "AUTH"/"UPLOAD"/5/10/100), `JwtAuthenticationFilter` ("Authorization"/"Bearer "), `AuthController` (tên cookie, path, max-age).

### 18. ✅ ĐÃ FIX — Hardcoded password trong `AdminInitialCreation`
Password admin ban đầu hardcode thẳng trong source (`"xWWlpaAj1%#pS7"`) — lộ vĩnh viễn trong git history. Đổi sang đọc `ADMIN_INITIAL_PASSWORD` từ env, fallback tự sinh UUID random + log ra 1 lần lúc startup nếu không set.

### 19. ✅ ĐÃ FIX — Redis Caching Framework đầy đủ (core + entity + repository), mirror wiki-service
Đọc trực tiếp code thật của wiki-service (annotation, `AbstractRedisRepository`, `DbSyncService`, `SyncRecoveryService`) qua agent khảo sát, port sang IT_JOB với 2 điều chỉnh biết rõ lý do:
1. UPSERT trong `DbSyncService` viết lại theo cú pháp MariaDB (`ON DUPLICATE KEY UPDATE`) thay Postgres (`ON CONFLICT`).
2. `Job.id` sinh bởi DB sequence (khác UUID client-generatable của entity mẫu wiki-service) → `JobRedis` dùng `SyncStrategy.CACHE_ONLY` + `autoSync=false` (Redis chỉ cache đọc, MariaDB vẫn là nơi ghi duy nhất qua `JobServiceImpl` sẵn có) — xem lý do đầy đủ ở CLAUDE.md phần "Redis Caching Framework". Cũng vì `Job.tags`/`Job.images` là `@ElementCollection` (bảng con), UPSERT 1-bảng generic không xử lý đúng nếu dùng WRITE_BEHIND/WRITE_THROUGH.

File mới: `constants/{RedisConstants,SyncConstants,SyncStrategy,SyncOperation}`, `redis/core/annotation/{RedisEntity,RedisIndexed,RedisId,LinkedJpaEntity,RedisTransient,TimeToLive}`, `redis/core/entity/BaseRedisEntity`, `redis/core/repository/{RedisRepository,RedisCrudRepository,RedisJpaRepository,AbstractRedisRepository}`, `redis/core/sync/{SyncTask,SyncCallback,DbSyncService,SyncRecoveryService}`, `redis/core/config/RedisCoreConfig`, `redis/core/exception/{RedisEntityNotFoundException,RedisOptimisticLockingException,RedisSyncException}`, `redis/entity/JobRedis`, `redis/repository/JobRedisRepository`.

Wire vào `JobServiceImpl`: `createJob`/`editJob`/`deleteJob` cập nhật cache ngay sau khi JPA write thành công (không để cache stale). Thêm `JobService.getCachedJobResponse(Long)` (đọc qua `JobRedisRepository`, cache-aside tự fallback DB khi miss) — **CHỈ dùng ở `JobController.getJobInfo`** (endpoint đọc thuần). **KHÔNG** đổi `JobService.getJobByID` (vẫn JPA-managed) — `CVServiceImpl.addCV` dựa vào Hibernate dirty-checking để lưu `appliedCount` tăng dần mà không có `.save()` tường minh; nếu đổi sang đọc qua Redis (detached object), thay đổi này sẽ mất âm thầm. Đây là quyết định thiết kế quan trọng nhất của đợt này — xem "⚠️" trong CLAUDE.md.

`pom.xml` thêm `spring-boot-starter-data-redis` + `commons-pool2` (bắt buộc để `spring.data.redis.lettuce.pool.*` có tác dụng — không tự có transitively). `application.properties` thêm block `spring.data.redis.*`.

**Chưa test được với Redis thật** trong sandbox này (không có Redis server chạy sẵn, giống lý do chưa test MariaDB thật ở đợt 1) — chỉ verify được bằng `./mvnw clean compile` (BUILD SUCCESS) và review kỹ từng chỗ wiring (generic type resolution, `@Qualifier` cho `ObjectMapper` tránh đụng bean mặc định của Spring Boot, Spring Boot's `@ConditionalOnMissingBean(name="redisTemplate")` không xung đột với bean tự định nghĩa cùng tên). **Cần bạn tự chạy với Redis thật để xác nhận cache hit/miss/fallback đúng như thiết kế** trước khi tin tưởng hoàn toàn.

### Chưa làm trong đợt này (biết rõ, không phải quên)
- Migrate `RateLimitingFilter` sang Redis backend (`bucket4j-redis`) — Redis đã có sẵn trong project từ mục 19, đây là bước tự nhiên tiếp theo nhưng để riêng vì đổi cơ chế rate-limit cần test kỹ hơn N+1 fix thông thường.
- Pagination cho list API — vẫn chưa làm, xem CLAUDE.md phần "Còn nợ".
- Test tự động cho toàn bộ phần vừa thêm (Redis framework, exception mapping) — project vẫn chỉ có 1 test rỗng (`DemoApplicationTests`).
- Chỉ mới có 1 entity Redis cụ thể (`JobRedis`) — `Account`/company profile là candidate tự nhiên tiếp theo (đọc nhiều trong `toCardList`/`toDTOList`) nhưng chưa làm, tránh mở rộng khi chưa đo được nhu cầu thật.
