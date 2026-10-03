# IT_JOB — Feature Implementation Guides

Mỗi file trong `docs/features/` là hướng dẫn triển khai **chi tiết** cho 1 phase trong [ROADMAP.md](../../ROADMAP.md) — package/class cụ thể, thứ tự bước, schema, config, testing checklist, Definition of Done. ROADMAP.md trả lời "làm gì và vì sao"; các file ở đây trả lời "làm như thế nào, theo thứ tự nào, xong khi nào coi là done".

Quy tắc code khi triển khai bất kỳ phase nào: theo [CLAUDE.md](../../CLAUDE.md) (SOLID, DI qua interface, N+1 prevention, Entity Design Rule, ApiResponse wrapper...).

## Danh sách phase

| File | Phase | Ưu tiên | Phụ thuộc |
|---|---|---|---|
| [00-foundation.md](00-foundation.md) | Phase 0 — Foundation (event bus, Notification schema, Flyway) | Cao nhất | Không |
| [01-notifications.md](01-notifications.md) | Phase 1 — Multi-channel Notifications (Email/SMS/In-app/Zalo/Telegram) | Cao | Phase 0 |
| [02-google-calendar.md](02-google-calendar.md) | Phase 2 — Google Calendar Integration | Trung bình | Phase 0, 1 |
| [03-webhooks-and-bots.md](03-webhooks-and-bots.md) | Phase 3 — Outbound Webhooks & Telegram/Zalo Bot | Trung bình | Phase 0, 1 |
| [04-search-and-recommendation.md](04-search-and-recommendation.md) | Phase 4 — Search & Recommendation Upgrade | Trung bình | Phase 0 (4.4 cần Phase 1+6) |
| [05-ai-agent.md](05-ai-agent.md) | Phase 5 — AI Agent Integration | Thấp (làm sau cùng) | Phase 1, 3B, 4 |
| [06-scaling-and-infra.md](06-scaling-and-infra.md) | Phase 6 — Scaling & Infra (Redis, Scheduler, Observability) | Chạy xen kẽ | Không bắt buộc, nhưng Phase 4.2/4.4 cần 6.1/6.2 |
| [07-admin-dashboard.md](07-admin-dashboard.md) | Phase 7 — Admin/Ops Dashboard | Thấp (làm sau cùng) | Phase 1, 3, 5 |

## Spec chi tiết theo tính năng (BE + FE, PostgreSQL)

Ba file dưới đây là bản đặc tả đầy đủ 5 phần (nghiệp vụ → DB → Backend → Frontend → Acceptance/Test) để BE và FE làm độc lập. Chúng **bám đúng hiện trạng repo** (Flyway `V1`–`V3`, JWT, `ApiResponse<T>`, `JobAlert` CRUD đã có) và **thay thế** các điểm lệch (ví dụ code mẫu MySQL) trong file cùng chủ đề ở bảng trên.

| File | Nội dung | Thay thế/bổ sung | Phụ thuộc |
|---|---|---|---|
| [phase-1-notifications.md](phase-1-notifications.md) | Transactional outbox + `AFTER_COMMIT/@Async`, In-App STOMP, Email Thymeleaf, Telegram Bot (kèm nút Duyệt/Từ chối) | Thay [00-foundation.md](00-foundation.md) (event/notification) + [01-notifications.md](01-notifications.md) | Không; phải hoàn tất security hardening P1–P7 trước |
| [phase-2-interview-calendar.md](phase-2-interview-calendar.md) | `Interview`, durable Calendar sync, Google OAuth2 PKCE/OIDC (HR là organizer), nhắc lịch | Bổ sung [02-google-calendar.md](02-google-calendar.md) | phase-1 đạt Definition of Done |
| [phase-4-job-alert.md](phase-4-job-alert.md) | Job Alert: tần suất, scheduler + ghép ngược, chống gửi trùng, unsubscribe có version | Mở rộng CRUD `JobAlert` đã có | phase-1 đạt Definition of Done; không phụ thuộc phase-2 |

Thứ tự migration đề xuất: `V4` (phase-1) → `V5` (phase-2) → `V6` (phase-4). Đánh lại số nếu merge khác thứ tự.

### Quyết định đã khoá cho ba spec

- PostgreSQL/Flyway là nguồn schema duy nhất; sau V4 runtime dùng `ddl-auto=validate` ở cả application config và Docker Compose.
- Domain event được ghi vào transactional outbox cùng transaction nghiệp vụ. `AFTER_COMMIT + @Async` chỉ giảm độ trễ; scheduler/recovery worker mới bảo đảm không mất event khi restart.
- Delivery ra SMTP/Telegram là **at-least-once**; unique key bảo vệ dữ liệu nội bộ nhưng không tuyên bố exactly-once với provider ngoài.
- Google Calendar chỉ yêu cầu HR OAuth; candidate nhận attendee invite/`.ics`. Google RSVP không sync ngược về IT_JOB trong v1.
- CV đã đi vào quy trình tuyển dụng được withdraw mềm bằng `WITHDRAWN`, không hard-delete trước khi Calendar cleanup hoàn tất.
- Job "thoả thuận" không khớp alert có lọc lương. V1 gửi digest theo từng alert, chưa gom nhiều alert theo account.
- Scheduler dùng `@Scheduled + ShedLock`; không thêm Kafka, RabbitMQ hoặc Quartz trong ba phase này.

`V4` bao gồm notification/delivery/preference, domain outbox, Telegram inbox/link, ShedLock và CV concurrency. `V5` bao gồm interview/OAuth/durable Calendar task. `V6` bao gồm `published_at`, alert watermark/frequency, unsubscribe version, match ledger và run log.

## Cách dùng

1. Đọc `ROADMAP.md` để hiểu bức tranh tổng, chọn phase muốn làm.
2. Mở file phase tương ứng ở đây, làm theo đúng thứ tự bước — mỗi bước đủ nhỏ để commit riêng. Không bắt đầu V5/V6 khi Phase 1 chưa đạt Definition of Done.
3. Check "Definition of Done" cuối file trước khi coi phase là xong.
4. Không nhảy sang phase phụ thuộc trước khi phase gốc đạt Definition of Done.
