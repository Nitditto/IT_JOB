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

## Cách dùng

1. Đọc `ROADMAP.md` để hiểu bức tranh tổng, chọn phase muốn làm.
2. Mở file phase tương ứng ở đây, làm theo đúng thứ tự bước — mỗi bước đủ nhỏ để commit riêng.
3. Check "Definition of Done" cuối file trước khi coi phase là xong.
4. Không nhảy sang phase phụ thuộc trước khi phase gốc đạt Definition of Done.
