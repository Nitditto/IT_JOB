# IT_JOB — Feature Roadmap

Roadmap phát triển thêm cho project sau giai đoạn CRUD nền tảng. Sắp xếp theo **phase**: phase sau phụ thuộc hạ tầng của phase trước, nên đọc/làm theo thứ tự, không nhảy cóc. Đây là tài liệu **để maintain & mở rộng dần** — không phải làm hết một lần.

**Hướng dẫn triển khai chi tiết từng phase** (package/class cụ thể, migration SQL, testing checklist, Definition of Done): xem [`docs/features/`](docs/features/README.md). File này (ROADMAP.md) chỉ trả lời "làm gì và vì sao" ở mức tổng quan.

## 0. Hiện trạng (baseline)

- **Backend**: Spring Boot 3.5.5, Java 17, MariaDB, Spring Security + JWT (access + refresh token), rate limit bằng Bucket4j (in-memory), JPA Specification + EntityGraph cho query.
- **Frontend**: React + Vite + Tailwind 4.
- **Domain chính**: `Account` (candidate/company dùng chung bảng qua `role`), `Job`, `CV` (= hồ sơ ứng tuyển, khoá kết hợp account+job, có `CVStatus`: PENDING/APPROVED/REJECTED), `Location`.
- **Đã có sẵn 1 phần "thông minh"**: `TfIdfRecommender` — gợi ý job cho candidate bằng TF-IDF + Cosine Similarity, tính hoàn toàn trong request (không cache).
- **Chưa có**: migration tool, email/SMS/notification service, event/queue system, cache layer (Redis), scheduler, tích hợp bên thứ 3 (Google, Telegram, Zalo), AI/LLM.

## Nguyên tắc ưu tiên

1. Mọi tính năng "thông báo" (email, SMS, Zalo, Telegram, webhook, calendar) đều đi qua **một event bus nội bộ** và **một lớp abstraction đa kênh (channel)** — tránh việc mỗi service tự gọi `emailService.send()` rải rác khắp code, và tránh phải sửa lại toàn bộ khi thêm kênh mới.
2. Mọi thay đổi schema đều đi qua migration tool — vì từ giờ sẽ thêm nhiều bảng mới.
3. Ưu tiên tính năng có giá trị thật với domain tuyển dụng (VN market), trước tính năng "cho vui công nghệ".
4. Mỗi kênh bên ngoài (Google, Telegram, Zalo, SMS provider, LLM) đều là **plugin độc lập** đứng sau interface chung — tắt/bật được từng kênh qua config, không phụ thuộc chéo.

---

## Phase 0 — Nền tảng (bắt buộc làm trước tất cả)

| # | Việc | Vì sao cần |
|---|------|------------|
| 0.1 | **Flyway** (migration versioning) | Từ giờ schema thay đổi liên tục qua nhiều phase |
| 0.2 | Mở rộng `CVStatus`: thêm `INTERVIEW_SCHEDULED`, `INTERVIEW_DONE`, `OFFERED`, `WITHDRAWN` | Interview/Calendar/Notification đều cần trạng thái trung gian |
| 0.3 | Entity `Interview` (thời gian, địa điểm/link, timezone, danh sách interviewer, `CV` liên kết, `googleEventId` nullable) | Nền cho Phase 2 (Calendar) |
| 0.4 | **Event bus nội bộ**: Spring `ApplicationEvent` + `@Async` (`JobCreatedEvent`, `CvStatusChangedEvent`, `InterviewScheduledEvent`, `InterviewCancelledEvent`...) | Mọi kênh thông báo ở Phase 1/2/3 chỉ cần *lắng nghe*, không sửa service cũ |
| 0.5 | Entity `Notification` (recipient, event type, payload JSON, channel, trạng thái gửi, `readAt`) + `NotificationPreference` (account, event type, channel bật/tắt) | Nền dữ liệu chung cho toàn bộ Phase 1 — user tự chọn nhận qua Email/SMS/Zalo/Telegram/in-app cho từng loại event |
| 0.6 | Interface `NotificationChannel` (`send(Notification n)`) — mỗi kênh (Email/SMS/Zalo/Telegram/in-app) implement riêng, `NotificationDispatcher` chọn channel theo `NotificationPreference` | Strategy pattern — thêm kênh mới không đụng code cũ |

**Độ khó:** thấp–trung. **Ưu tiên:** cao nhất.

---

## Phase 1 — Hệ thống Notification đa kênh

> Đổi từ "Email Notification" thành hệ thống đa kênh, vì Email/SMS/Zalo/Telegram/in-app đều dùng chung hạ tầng Phase 0.5–0.6, chỉ khác `NotificationChannel` implementation.

### 1A. Email
| # | Việc |
|---|------|
| 1A.1 | `spring-boot-starter-mail` + SMTP (Gmail SMTP để dev, SendGrid/Mailgun free tier để prod) |
| 1A.2 | Template Thymeleaf (`application-received`, `status-changed`, `interview-scheduled`, `interview-reminder`) |
| 1A.3 | Gửi **async**, không block request chính |
| 1A.4 | Đơn giản: dùng lại `notification_log` (Phase 0.5) để biết email nào gửi lỗi |

### 1B. SMS
| # | Việc |
|---|------|
| 1B.1 | Chọn provider: Twilio (quốc tế, dễ tích hợp, không cần đăng ký brandname) hoặc eSMS.vn/SpeedSMS/FPT SMS (VN, rẻ hơn, cần đăng ký brandname doanh nghiệp) |
| 1B.2 | Dùng cho: OTP xác thực số điện thoại khi đăng ký, nhắc lịch phỏng vấn trong ngày (email dễ bị bỏ lỡ hơn SMS) |
| 1B.3 | Giới hạn: SMS tốn tiền theo tin — chỉ dùng cho event **quan trọng/gấp**, không dùng cho thông báo thường (đã có email/in-app) |

### 1C. In-app Notification Center
| # | Việc |
|---|------|
| 1C.1 | Icon chuông trên UI, danh sách `Notification` của user, đánh dấu đã đọc |
| 1C.2 | Real-time: WebSocket (STOMP) hoặc SSE để đẩy notification mới không cần reload trang |
| 1C.3 | Đây là kênh **rẻ nhất và nên có mặc định** cho mọi event — không tốn chi phí bên ngoài như SMS/Zalo |

### 1D. Zalo ZNS / Zalo Official Account
| # | Việc |
|---|------|
| 1D.1 | Đăng ký Zalo OA (Official Account) cho công ty, xin quyền gửi ZNS (Zalo Notification Service) — cần duyệt hồ sơ doanh nghiệp, mất thời gian hơn Telegram |
| 1D.2 | Candidate liên kết tài khoản Zalo (OAuth Zalo hoặc quét QR follow OA) để nhận thông báo |
| 1D.3 | Phù hợp cho: nhắc lịch phỏng vấn, thông báo trạng thái CV — vì phổ biến ở VN hơn email với nhóm lao động phổ thông |
| 1D.4 | **Ghi chú:** ZNS tính phí theo tin, cần duyệt template nội dung trước với Zalo — phức tạp hành chính hơn kỹ thuật |

### 1E. Telegram Bot notification
| # | Việc |
|---|------|
| 1E.1 | Tạo bot qua @BotFather, dùng Telegram Bot API (miễn phí, không cần duyệt như Zalo) |
| 1E.2 | User liên kết Telegram: bấm nút "Kết nối Telegram" → deep link `t.me/<bot>?start=<token>` → bot nhận `/start <token>` → hệ thống map `chat_id` với `Account` |
| 1E.3 | Công ty có thể tạo **group chat**, thêm bot vào group để cả team nhận thông báo ứng viên mới cùng lúc |
| 1E.4 | Dễ làm nhất trong các kênh ngoài — nên làm **trước** Zalo để có kênh chat thật hoạt động sớm |

### 1F. Kiến trúc & vận hành chung
| # | Việc |
|---|------|
| 1F.1 | `NotificationDispatcher`: nhận event → tra `NotificationPreference` → gọi đúng `NotificationChannel` → nếu lỗi, fallback sang channel khác (ví dụ Zalo lỗi → fallback email) |
| 1F.2 | Retry có backoff (3 lần) cho channel lỗi tạm thời; quá số lần → lưu trạng thái `FAILED` trong `notification_log`, hiện cảnh báo cho admin |
| 1F.3 | **Idempotency**: mỗi `Notification` gắn `eventId` duy nhất — tránh gửi trùng khi retry hoặc khi consumer chạy lại |
| 1F.4 | Trang settings cho user: chọn nhận loại thông báo nào qua kênh nào (ví dụ: "trạng thái CV" → Email + in-app, "lịch phỏng vấn" → thêm SMS/Telegram) |

**Độ khó:** thấp (Email, in-app, Telegram) → trung–cao (Zalo do thủ tục duyệt). **Ưu tiên:** Email + in-app + Telegram làm trước (nhanh, rẻ, không cần duyệt); SMS + Zalo làm sau khi có ngân sách/nhu cầu thật.

---

## Phase 2 — Tích hợp Google Calendar thật

| # | Việc |
|---|------|
| 2.1 | Đăng ký Google Cloud project, OAuth2 Client (Calendar API scope) |
| 2.2 | Flow OAuth2 consent (`spring-security-oauth2-client`): user bấm "Kết nối Google Calendar" → Google consent → lưu `access_token`/`refresh_token` **mã hoá** vào `google_calendar_credential` gắn `Account` |
| 2.3 | `Interview` tạo/sửa/huỷ → gọi Calendar API (`events.insert`/`update`/`delete`), lưu `googleEventId` để lần sau sửa đúng event |
| 2.4 | Tự refresh access token khi hết hạn (~1h); xử lý lỗi 401/429 (quota) có retry hợp lý |
| 2.5 | **Timezone**: lưu timezone của từng interviewer/candidate riêng — công ty và ứng viên có thể ở múi giờ khác nhau (remote job) |
| 2.6 | **Multi-interviewer**: 1 Interview có thể có nhiều người phía công ty (HR + tech lead) — mỗi người có Google Calendar riêng, cần add hết vào event là "attendee" |
| 2.7 | Reminder buffer: Google Calendar tự nhắc trước 30'/1 ngày (cấu hình trong `events.insert`), kết hợp thêm SMS/Telegram nhắc từ Phase 1 cho chắc |
| 2.8 | Fallback `.ics` gửi kèm email nếu user không kết nối Google — không phụ thuộc cứng vào OAuth |
| 2.9 | (nâng cao, optional) Google push notification (webhook Google gửi về khi user tự sửa event bên Google) → đồng bộ ngược trạng thái Interview trong hệ thống |
| 2.10 | (nâng cao, optional) Hỗ trợ thêm **Outlook/Microsoft Calendar** qua Microsoft Graph API — cùng pattern OAuth như Google, làm sau khi Google ổn |

**Rủi ro:** token là dữ liệu nhạy cảm — mã hoá at-rest (Jasypt/AES field-level), không log ra console, cho phép user revoke kết nối.

**Độ khó:** trung–cao. **Ưu tiên:** trung bình — sau khi Phase 0+1 ổn định.

---

## Phase 3 — Webhook & Bot tích hợp hai chiều

### 3A. Outbound webhook (cho hệ thống thứ 3 tuỳ ý, kiểu Stripe/GitHub webhook)
| # | Việc |
|---|------|
| 3A.1 | Entity `WebhookSubscription` (company đăng ký URL + `secret` HMAC + danh sách event quan tâm) |
| 3A.2 | `WebhookDispatcher` lắng nghe event Phase 0.4 → POST JSON, ký `X-Signature: HMAC-SHA256(secret, body)` |
| 3A.3 | Retry backoff (3 lần) khi endpoint đích lỗi/timeout; log `webhook_delivery_log` (status, response code, thời gian, số lần retry) |
| 3A.4 | **Event catalog** có version (`job.created.v1`) — để sau này đổi payload không phá vỡ subscriber cũ |
| 3A.5 | Trang admin: xem log delivery, nút "replay" gửi lại 1 event cũ thủ công |

### 3B. Telegram Bot — tương tác hai chiều (không chỉ gửi, còn nhận lệnh)
| # | Việc |
|---|------|
| 3B.1 | Endpoint webhook nhận `Update` từ Telegram (message, `callback_query` khi bấm inline button) |
| 3B.2 | Company nhận thông báo CV mới trong group **kèm 2 nút inline "Duyệt" / "Từ chối"** → bấm trực tiếp trong Telegram → gọi lại `CVService.updateStatus(...)` — không cần mở web |
| 3B.3 | Candidate dùng lệnh `/status` để bot trả lời trạng thái các CV đã nộp, `/jobs` để xem gợi ý job mới nhất |
| 3B.4 | Verify request đến từ Telegram bằng `secret_token` header (Telegram Bot API hỗ trợ sẵn khi set webhook) |

### 3C. Zalo OA — tương tác hai chiều (tương tự Telegram, phức tạp hơn)
| # | Việc |
|---|------|
| 3C.1 | Webhook nhận event từ Zalo OA (user nhắn tin, bấm nút trong Zalo message template) |
| 3C.2 | Verify signature theo chuẩn Zalo (khác Telegram, dùng `mac` field + secret key riêng) |
| 3C.3 | Use case tương tự Telegram nhưng ưu tiên thấp hơn — vì Zalo cần duyệt OA/template trước khi dùng được tính năng tương tác |

**Độ khó:** 3A trung, 3B thấp–trung (nên làm trước vì không cần duyệt gì), 3C trung–cao (thủ tục Zalo). **Ưu tiên:** 3B trước 3A trước 3C.

---

## Phase 4 — Nâng cấp Search & Recommendation

| # | Việc |
|---|------|
| 4.1 | Thay `LIKE` hiện tại bằng **MariaDB FULLTEXT index** cho `Job.name`/`description`/`tags` |
| 4.2 | Cache kết quả `TfIdfRecommender` theo candidate (Redis, TTL vài giờ) — hiện tính lại TF-IDF toàn bộ job mỗi request |
| 4.3 | **Geo-search**: `Job` đã có `Location` — thêm tìm job "gần tôi" (lọc theo tỉnh/thành, hoặc bán kính km nếu có lat/long) |
| 4.4 | **Saved Search / Job Alert**: candidate lưu 1 bộ filter (vị trí, lương, workstyle) → Scheduled job (Phase 6.2) định kỳ quét job mới khớp filter → bắn `JobAlertEvent` → tái sử dụng Notification system (Phase 1) để báo qua email/Telegram/in-app. *(Đây là feature nối liền Search + Notification + Scheduler — nên làm sau khi cả 3 hạ tầng đó đã có)* |
| 4.5 | (nâng cao) **Semantic search bằng embedding**: dùng embedding model (OpenAI/Gemini embedding, hoặc model nhỏ chạy local như `all-MiniLM`) vector hoá CV & JD, so cosine — hiểu được "Java Developer" gần nghĩa "Backend Engineer" dù không trùng từ khoá, thứ TF-IDF hiện tại không làm được |
| 4.6 | Recompute embedding/TF-IDF theo lịch định kỳ (Phase 6.2) thay vì tính real-time mỗi request |

**Độ khó:** thấp (4.1, 4.3) → trung (4.2, 4.4) → cao (4.5). **Ưu tiên:** 4.1 và 4.4 (Job Alert) có giá trị/chi phí tốt nhất, nên làm trước 4.5.

---

## Phase 5 — Tích hợp AI Agent

| # | Việc |
|---|------|
| 5.1 | Chọn LLM provider (Claude/OpenAI/Gemini API), gọi qua REST |
| 5.2 | **Agent cho candidate**: chatbot trả lời câu hỏi về job, gợi ý sửa CV, viết cover letter draft dựa trên JD + CV |
| 5.3 | **Agent cho company**: tóm tắt CV ứng viên, chấm điểm phù hợp JD kèm giải thích bằng ngôn ngữ tự nhiên (khác TF-IDF ở chỗ có *lý do*), soạn câu hỏi phỏng vấn gợi ý |
| 5.4 | **CV parsing tự động**: candidate upload CV (PDF/ảnh) → OCR (nếu ảnh) + LLM extract có cấu trúc (họ tên, kinh nghiệm, kỹ năng) → tự điền form CV, giảm thao tác nhập tay |
| 5.5 | **Auto-tagging job**: khi company đăng job, LLM tự gợi ý `tags` từ nội dung `description` — giảm việc gõ tay, tăng chất lượng data cho TF-IDF/embedding ở Phase 4 |
| 5.6 | Function calling / tool use: agent gọi vào service có sẵn (`JobService.search`, `CVService.get`) thay vì "bịa" dữ liệu — bám dữ liệu thật trong DB |
| 5.7 | (mở rộng) Cho phép dùng agent **qua kênh chat có sẵn** — Telegram bot (Phase 3B) nhận câu hỏi tự nhiên, forward vào agent, trả lời ngay trong Telegram, không cần vào web |
| 5.8 | RAG (optional): kết hợp embedding Phase 4.5 — agent tìm job liên quan bằng vector search trước, rồi mới đưa vào prompt, giảm hallucination |
| 5.9 | Rate limit riêng cho endpoint agent (khác Bucket4j hiện tại) — gọi LLM tốn tiền, cần chặn spam/abuse |
| 5.10 | **Bảo mật prompt injection**: CV/JD do user upload đưa vào prompt — nếu sau này agent có quyền hành động (gửi email, đổi status), phải giới hạn agent chỉ *đọc*, hành động ghi (approve/reject) vẫn qua người dùng xác nhận, không để agent tự thực thi theo nội dung trích từ file người dùng upload |
| 5.11 | Dashboard theo dõi **chi phí** gọi LLM (token dùng/ngày, theo account) — để không bị vượt ngân sách âm thầm |

**Độ khó:** trung (5.2, 5.3) → cao (5.4 OCR, 5.8 RAG). **Ưu tiên:** làm sau cùng trong các phase tính năng — cần Phase 1 (channel để expose agent), Phase 4 (embedding cho RAG) làm nền trước; nhưng 5.2/5.3 (chatbot cơ bản, không RAG) có thể làm sớm hơn nếu muốn demo nhanh.

---

## Phase 6 — Scaling & Infra (chạy xen kẽ, không gấp)

| # | Việc |
|---|------|
| 6.1 | Redis: cache job listing + recommendation (4.2) + **rate limiter phân tán** (Bucket4j hiện tại in-memory, sai logic nếu chạy nhiều instance) |
| 6.2 | Scheduled job (`@Scheduled` hoặc Quartz nếu cần lịch phức tạp/persist qua restart): expire job hết hạn, nhắc lịch phỏng vấn trước 1 ngày, quét Job Alert (4.4), recompute embedding (4.5) |
| 6.3 | Load balancing: Nginx/API Gateway trước nhiều instance backend — JWT stateless nên không cần sticky session, chỉ cần fix 6.1 trước khi scale ngang |
| 6.4 | Observability: Micrometer + Prometheus/Grafana (Actuator đã có sẵn, chỉ cần expose thêm) — theo dõi latency, error rate, số lượng notification/webhook lỗi |
| 6.5 | CI: mở rộng `.github/workflows` hiện có để build + test tự động khi có PR; sau này thêm CD (auto deploy khi merge main) |
| 6.6 | Connection pool tuning (HikariCP) + xem xét read replica MariaDB khi lượng đọc (search/recommend) tăng cao |

**Độ khó:** thấp–trung. **Ưu tiên:** làm dần, ưu tiên 6.1 khi có ý định deploy nhiều instance, 6.4 hữu ích ngay để theo dõi các phase mới (notification/webhook có dễ fail không).

---

## Phase 7 — Admin/Ops Dashboard (gom lại các phase trên thành 1 màn hình quản trị)

| # | Việc |
|---|------|
| 7.1 | Trang quản trị xem `notification_log`, `webhook_delivery_log` — lọc theo trạng thái lỗi, resend thủ công |
| 7.2 | Quản lý kết nối bot (Telegram/Zalo OA) — bật/tắt, xem số user đã liên kết |
| 7.3 | Dashboard chi phí AI agent (5.11) + quota Google Calendar API đã dùng |
| 7.4 | Cấu hình `NotificationPreference` mặc định theo role (admin set default, user override) |

**Độ khó:** thấp–trung (chủ yếu là UI + query lên dữ liệu đã có từ các phase trên). **Ưu tiên:** làm sau khi có ít nhất 2-3 kênh notification/webhook hoạt động thật — lúc đó dashboard mới có dữ liệu để hiển thị.

---

## Thứ tự khuyến nghị tổng thể

```
Phase 0 (nền tảng: event bus + Notification/Preference schema)
   └─▶ Phase 1 (Notification đa kênh)
          ├─▶ 1C in-app + 1A email + 1E Telegram  (làm trước — nhanh, rẻ, không cần duyệt)
          └─▶ 1B SMS + 1D Zalo                      (làm sau — cần ngân sách/duyệt hồ sơ)
   └─▶ Phase 2 (Google Calendar)      — dùng lại Notification (fallback .ics) + Interview entity
   └─▶ Phase 3 (Webhook & Bot 2 chiều)
          ├─▶ 3B Telegram tương tác   (làm trước — dễ, không cần duyệt)
          ├─▶ 3A Outbound webhook generic
          └─▶ 3C Zalo tương tác       (làm sau — cần duyệt OA)
   └─▶ Phase 4 (Search/Recommend nâng cấp)
          ├─▶ 4.1 Fulltext, 4.4 Job Alert (dùng lại Notification + Scheduler)
          └─▶ 4.5 Semantic embedding   (nền cho Phase 5 RAG)
   └─▶ Phase 5 (AI Agent)             — expose qua Telegram (3B) khi có channel

Phase 6 (Scaling) chạy xen kẽ suốt quá trình, ưu tiên 6.1 khi chuẩn bị deploy nhiều instance
Phase 7 (Admin Dashboard) làm sau cùng, khi đã có dữ liệu thật từ các phase trên để hiển thị
```

## Rủi ro & lưu ý kỹ thuật chung

- **Bảo mật token/secret bên thứ 3** (Google OAuth, Telegram bot token, Zalo secret key): mã hoá at-rest, không log, cho phép revoke.
- **Chi phí vận hành**: SMS (theo tin), Zalo ZNS (theo tin), LLM API (theo token), Google Calendar API (quota free tier có giới hạn) — mỗi kênh cần rate limit/budget riêng, không dùng chung Bucket4j hiện tại.
- **Idempotency**: notification, webhook, bot message đều có thể gửi trùng khi retry — bắt buộc có `eventId` duy nhất để chặn gửi trùng.
- **Quyền riêng tư dữ liệu**: số điện thoại (SMS/Zalo), chat_id Telegram là dữ liệu cá nhân — chỉ lưu khi user chủ động liên kết, cho phép hủy liên kết bất kỳ lúc nào.
- **Xác thực webhook đến (inbound)**: Telegram dùng `secret_token` header, Zalo dùng `mac` signature riêng — không dùng chung 1 cơ chế verify cho cả 2 platform.
- **Testing**: mỗi phase nên có integration test cho phần listener (event → channel có được gọi đúng không), mock external API (Google/Telegram/Zalo/LLM/SMS) khi test, không gọi thật trong CI.
