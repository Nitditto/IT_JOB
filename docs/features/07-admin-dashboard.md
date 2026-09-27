# Phase 7 — Admin/Ops Dashboard

## Mục tiêu

Gom dữ liệu vận hành từ các phase trước (notification log, webhook delivery, bot connections, AI cost) vào 1 nơi cho admin theo dõi. Chủ yếu là UI + query trên dữ liệu đã tồn tại — không cần entity/nghiệp vụ mới lớn.

## Điều kiện tiên quyết

Phase 1 (notification_log có data), Phase 3 (webhook_delivery_log có data), Phase 5 (agent_usage_log có data). **Làm sau khi ít nhất 2-3 kênh đã hoạt động thật** — dashboard trên dữ liệu rỗng không có giá trị kiểm chứng.

## Kiến trúc / package structure

```
com.example.demo.admin
├── AdminNotificationController.java   # GET notification log, resend thủ công
├── AdminWebhookController.java        # GET webhook delivery log, replay
├── AdminBotController.java            # quản lý kết nối Telegram/Zalo
├── AdminAgentCostController.java      # dashboard chi phí AI
└── AdminNotificationPreferenceController.java  # default preference theo role
```

Toàn bộ controller trong package này bắt buộc `@PreAuthorize("hasRole('ADMIN')")` ở class level.

## Bước 1 — 7.1. Notification & Webhook log

```
GET /admin/notifications?status=FAILED&page=0&size=20
POST /admin/notifications/{id}/resend
GET /admin/webhooks/deliveries?status=FAILED
POST /admin/webhooks/deliveries/{id}/replay
```

`resend`/`replay` gọi lại đúng `NotificationDispatcher.dispatch()`/`WebhookDispatcher.deliverWithRetry()` đã có từ Phase 1/3 — **không viết logic gửi lại riêng**, tái sử dụng service đã kiểm chứng.

Response DTO (`AdminNotificationLogResponse`, `AdminWebhookDeliveryResponse`) — theo đúng nguyên tắc CLAUDE.md, không trả entity trực tiếp, dù đây là trang admin.

## Bước 2 — 7.2. Quản lý kết nối bot

```
GET /admin/bots/telegram/stats     — { totalLinked: number, activeLast7Days: number }
GET /admin/bots/zalo/stats
```
Query đơn giản: `COUNT(*) FROM accounts WHERE telegram_chat_id IS NOT NULL`. Không cần bảng riêng cho "connection log" trừ khi muốn track lịch sử liên kết/hủy liên kết theo thời gian — nếu cần, thêm sau, không làm trước khi có nhu cầu rõ.

## Bước 3 — 7.3. Dashboard chi phí AI + quota Google Calendar

```
GET /admin/agent/cost?from=2026-01-01&to=2026-01-31
  → { totalInputTokens, totalOutputTokens, estimatedCostUsd, byAccountTop10: [...] }
```
Query aggregate trên `AgentUsageLog` (Phase 5) — `GROUP BY DATE(created_at)` cho biểu đồ theo ngày, `GROUP BY account_id ORDER BY cost DESC LIMIT 10` cho top user tốn nhiều nhất (phát hiện abuse/lạm dụng).

Quota Google Calendar — Google không cung cấp API để query quota còn lại theo thời gian thực dễ dàng; cách thực tế: tự đếm số lần gọi Calendar API trong `GoogleCalendarServiceImpl` (tăng counter Redis/DB mỗi lần gọi), so với hạn mức free tier biết trước (xem Google Cloud Console để lấy số chính xác tại thời điểm implement — không hardcode số cũ vào tài liệu vì Google có thể thay đổi).

## Bước 4 — 7.4. Default Notification Preference theo role

```
GET  /admin/notification-defaults          — xem default hiện tại theo role
PUT  /admin/notification-defaults           — admin set default (ví dụ: mọi ROLE_USER mới mặc định nhận CV_STATUS_CHANGED qua Email+InApp)
```
Khi tạo `Account` mới (`UserServiceImpl.register`), copy default preference theo role vào `NotificationPreference` của account đó — user vẫn override được sau (đã có API từ Phase 1 bước 8).

## Frontend

Trang `/dashboard/admin/ops` (route mới) — bảng biểu đơn giản: table cho log (đã có pattern y hệt trang [`dashboard/admin/companies`](../../Frontend/itjob/src/pages/dashboard/admin/companies/page.tsx) hiện tại, copy cấu trúc table đó), chart cho cost theo ngày (dùng lại chart library nếu Frontend đã có, hoặc thêm `recharts` nếu chưa).

## Testing checklist

- [ ] Test phân quyền: gọi mọi endpoint `/admin/**` bằng token ROLE_USER/ROLE_COMPANY, xác nhận 403.
- [ ] Test `resend`/`replay` — verify gọi đúng lại dispatcher, không tạo logic gửi song song.
- [ ] Test aggregate query cost — dữ liệu giả lập vài `AgentUsageLog`, verify tổng tính đúng.

## Definition of Done

- [ ] Admin xem được danh sách notification/webhook lỗi, resend/replay thành công.
- [ ] Admin xem được dashboard chi phí AI theo ngày + top user.
- [ ] Default notification preference áp dụng đúng cho account mới tạo.

## Rủi ro / lưu ý

- Đây là trang có quyền cao nhất trong hệ thống (xem được data/cost toàn bộ user) — đảm bảo `@PreAuthorize` đúng ở **mọi** endpoint, không sót 1 method nào (lỗi hay gặp: class có `@PreAuthorize` nhưng 1 method mới thêm sau quên annotation, hoặc annotation chỉ ở class mà Spring Security method security không tự áp dụng cho method `public` không override đúng cách — verify bằng test, không chỉ đọc code).
- `resend` hàng loạt (nếu admin bấm resend nhiều bản ghi cùng lúc) cần rate limit riêng để không vô tình spam lại toàn bộ user một lúc — cân nhắc giới hạn số lượng resend cùng lúc hoặc yêu cầu xác nhận rõ trên UI trước khi thực thi.
