# Phase 1 — Multi-channel Notifications

## Mục tiêu

Biến khung sườn ở Phase 0 (`Notification` record được tạo nhưng chưa gửi đi đâu) thành hệ thống gửi thật qua nhiều kênh: Email, In-app, Telegram trước (rẻ, nhanh, không cần duyệt), SMS/Zalo sau (cần ngân sách/duyệt hồ sơ).

## Điều kiện tiên quyết

Phase 0 xong: event bus hoạt động, `Notification`/`NotificationPreference` entity tồn tại, `NotificationEventListener` nhận được event.

## Kiến trúc / package structure

```
com.example.demo.notification
├── channel/
│   ├── NotificationChannel.java          # interface — Strategy pattern
│   ├── EmailNotificationChannel.java
│   ├── InAppNotificationChannel.java
│   ├── TelegramNotificationChannel.java
│   ├── SmsNotificationChannel.java       # làm sau (1B)
│   └── ZaloNotificationChannel.java      # làm sau (1D)
├── NotificationDispatcher.java           # tra NotificationPreference, chọn channel, gọi send(), retry
├── NotificationEventListener.java        # SỬA lại từ Phase 0 — gọi Dispatcher thay vì chỉ log
├── template/
│   └── (Thymeleaf templates ở resources/templates/email/)
└── telegram/
    ├── TelegramLinkController.java        # REST: tạo deep-link token, xử lý /start
    └── TelegramLinkService.java
```

## Bước 1 — Interface `NotificationChannel` (Strategy pattern)

```java
package com.example.demo.notification.channel;

public interface NotificationChannel {
    NotificationChannelType getType();
    void send(Notification notification) throws NotificationDeliveryException;
}
```

`NotificationDeliveryException` — custom exception (extends `RuntimeException`), dùng để `NotificationDispatcher` biết khi nào retry/fallback.

Đăng ký tất cả channel implementation là Spring bean (`@Component`), Spring tự inject `List<NotificationChannel>` vào `NotificationDispatcher` — không cần factory thủ công:

```java
@Component
@RequiredArgsConstructor
public class NotificationDispatcher {
    private final List<NotificationChannel> channels;
    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationRepository notificationRepository;

    private Map<NotificationChannelType, NotificationChannel> channelByType;

    @PostConstruct
    void init() {
        channelByType = channels.stream()
            .collect(Collectors.toMap(NotificationChannel::getType, c -> c));
    }
    ...
}
```

## Bước 2 — 1A. Email

1. Thêm dependency: `spring-boot-starter-mail`.
2. Config (`application.properties`, dùng biến môi trường qua `.env`, không hardcode secret):
   ```properties
   spring.mail.host=${MAIL_HOST:smtp.gmail.com}
   spring.mail.port=${MAIL_PORT:587}
   spring.mail.username=${MAIL_USERNAME:}
   spring.mail.password=${MAIL_PASSWORD:}
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   ```
3. Thêm `spring-boot-starter-thymeleaf` để render template email (Thymeleaf vốn là template engine, dùng được cho cả HTML email, không chỉ web view).
4. Template tại `src/main/resources/templates/email/`:
   - `cv-status-changed.html`
   - `interview-scheduled.html`
   - `interview-reminder.html` (dùng ở Phase 6.2)
5. `EmailNotificationChannel`:
   ```java
   @Component
   @RequiredArgsConstructor
   public class EmailNotificationChannel implements NotificationChannel {
       private final JavaMailSender mailSender;
       private final TemplateEngine templateEngine;
       private final AccountRepository accountRepository;

       @Override
       public NotificationChannelType getType() { return NotificationChannelType.EMAIL; }

       @Override
       public void send(Notification notification) {
           Account recipient = accountRepository.findById(notification.getRecipientAccountId())
               .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người nhận"));

           Context ctx = new Context();
           ctx.setVariables(parsePayload(notification.getPayload())); // Map<String,Object> từ JSON
           String html = templateEngine.process(templateNameFor(notification.getEventType()), ctx);

           MimeMessagePreparator preparator = mime -> {
               MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
               helper.setTo(recipient.getEmail());
               helper.setSubject(subjectFor(notification.getEventType()));
               helper.setText(html, true);
           };
           try {
               mailSender.send(preparator);
           } catch (MailException ex) {
               throw new NotificationDeliveryException("Gửi email thất bại", ex);
           }
       }
   }
   ```
6. **Không gọi `mailSender.send()` trực tiếp trong request thread** — `NotificationDispatcher.dispatch()` đã chạy trong `@Async` listener từ Phase 0, nên không cần thêm `@Async` ở đây nữa (tránh double-async gây khó trace lỗi).

## Bước 3 — 1C. In-app Notification Center (làm cùng lúc với Email vì rẻ nhất)

`InAppNotificationChannel.send()` **không cần gọi API bên ngoài nào** — bản chất đã là `Notification` record trong DB (từ Phase 0), "gửi" ở đây chỉ là set `deliveryStatus = SENT`. Điểm cần làm thêm là API + real-time push:

1. `NotificationController` (REST):
   ```
   GET  /notifications              — list (phân trang) của user hiện tại
   GET  /notifications/unread-count
   PATCH /notifications/{id}/read
   PATCH /notifications/mark-all-read
   ```
   Toàn bộ trả về `ApiResponse<T>` theo chuẩn CLAUDE.md, có `NotificationResponse` DTO riêng — **không trả entity `Notification` trực tiếp**.

2. Real-time: dùng WebSocket (STOMP) — Spring có `spring-boot-starter-websocket`. Endpoint `/ws`, mỗi user subscribe topic riêng `/topic/notifications/{accountId}` (hoặc dùng `SimpMessagingTemplate.convertAndSendToUser` với principal name = email để không cần lộ accountId trên topic public). `InAppNotificationChannel.send()` sau khi lưu DB thì gọi thêm:
   ```java
   messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/notifications", toResponse(notification));
   ```
   Nếu chưa muốn làm WebSocket ngay, có thể tạm bỏ qua bước real-time — frontend poll `GET /notifications/unread-count` mỗi 30s vẫn hoạt động, chỉ kém "tức thời" hơn. Đánh dấu TODO rõ ràng nếu chọn hướng tạm này.

## Bước 4 — 1E. Telegram Bot (làm trước Zalo — không cần duyệt)

1. Tạo bot qua Telegram's **@BotFather** (Telegram app, không phải code) → lấy `bot_token`.
2. Config:
   ```properties
   app.telegram.bot-token=${TELEGRAM_BOT_TOKEN:}
   app.telegram.bot-username=${TELEGRAM_BOT_USERNAME:}
   ```
3. Entity mở rộng: thêm cột `telegram_chat_id` (nullable `Long`) vào `Account`, hoặc — theo Entity Design Rule, vì đây là 1 thuộc tính phụ của aggregate root — thêm thẳng cột vào `accounts` table qua migration `V4__add_telegram_chat_id.sql` là hợp lý hơn tạo bảng riêng (dữ liệu 1-1 với Account, không có lifecycle riêng).
4. Flow liên kết:
   - Frontend: nút "Kết nối Telegram" → gọi `POST /notifications/telegram/link-token` → backend sinh 1 token ngẫu nhiên (UUID), lưu tạm (Redis TTL 5 phút nếu đã có Redis từ Phase 6, hoặc bảng tạm `telegram_link_token` nếu chưa) map `token → accountId`.
   - Frontend hiện link `https://t.me/<bot_username>?start=<token>`.
   - User bấm link → mở Telegram → gửi `/start <token>` cho bot.
   - Bot nhận update qua **webhook** (khuyến nghị, xem Phase 3B để setup) hoặc long-polling tạm thời để test nhanh (dùng `TelegramLongPollingBot` từ thư viện `telegrambots` — chỉ nên dùng long-polling khi dev local, chuyển sang webhook khi deploy vì long-polling giữ 1 connection sống liên tục, không hợp môi trường serverless/nhiều instance).
   - Backend nhận `/start <token>` → tra token → set `account.telegramChatId = update.getChatId()`.
5. `TelegramNotificationChannel.send()`: gọi Telegram Bot API qua `RestClient`/`RestTemplate`:
   ```java
   String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
   Map<String, Object> body = Map.of(
       "chat_id", account.getTelegramChatId(),
       "text", renderPlainText(notification),
       "parse_mode", "Markdown"
   );
   restClient.post().uri(url).body(body).retrieve().toBodilessEntity();
   ```
   Nếu `telegramChatId == null` (user chưa liên kết) → throw `NotificationDeliveryException` để Dispatcher fallback sang Email (xem 1F.1).

## Bước 5 — 1B. SMS (làm sau, cần ngân sách)

1. Chọn provider theo mục tiêu:
   - **Twilio**: quốc tế, SDK Java chính thức (`com.twilio.sdk:twilio`), không cần đăng ký brandname VN, giá cao hơn khi gửi số VN.
   - **eSMS.vn / SpeedSMS**: rẻ hơn cho số VN, cần đăng ký brandname doanh nghiệp (mất vài ngày duyệt), tích hợp qua REST API thường (không có SDK Java chính thức, tự gọi qua `RestClient`).
2. `SmsNotificationChannel` theo cùng interface `NotificationChannel`, `getType() = SMS`.
3. Dùng SMS **chỉ** cho `NotificationEventType` được đánh dấu "urgent" (OTP đăng ký, nhắc lịch phỏng vấn trong ngày) — không dùng cho mọi event, vì tốn phí theo tin. Thêm 1 field `boolean smsEligible` vào `NotificationEventType` (enum có thể mang thêm field/method) hoặc 1 `Set<NotificationEventType>` cấu hình trong `NotificationDispatcher`.

## Bước 6 — 1D. Zalo ZNS (làm sau cùng, cần duyệt hồ sơ)

1. Đăng ký Zalo OA (ngoài code, qua Zalo Developer portal) — cần hồ sơ doanh nghiệp thật, KHÔNG làm được trong lúc dev nếu chưa có OA thật.
2. Zalo yêu cầu duyệt **template nội dung** trước khi gửi ZNS — không tự do render HTML như email, phải theo format Zalo cấp.
3. `ZaloNotificationChannel.send()` gọi Zalo OA API (`https://openapi.zalo.me/v3.0/oa/message/cs`), auth bằng access token OA (khác cơ chế OAuth2 người dùng — đây là app-level token, xin từ Zalo Developer Console).
4. Vì tốn thời gian hành chính, **không block phase khác** vào bước này — implement sau, để `ZaloNotificationChannel` throw `UnsupportedOperationException` tạm nếu chưa có OA thật, Dispatcher tự fallback sang Email/In-app.

## Bước 7 — 1F. `NotificationDispatcher` (ghép tất cả channel lại)

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationDispatcher {
    private final List<NotificationChannel> channels;
    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationRepository notificationRepository;

    public void dispatch(Notification notification) {
        List<NotificationChannelType> preferredChannels = resolveChannels(notification);

        for (NotificationChannelType type : preferredChannels) {
            NotificationChannel channel = channelByType.get(type);
            if (tryDeliver(channel, notification)) {
                notification.setChannel(type);
                notification.setDeliveryStatus(NotificationDeliveryStatus.SENT);
                notificationRepository.save(notification);
                return; // gửi được 1 channel là đủ, không gửi tràn hết
            }
        }
        notification.setDeliveryStatus(NotificationDeliveryStatus.FAILED);
        notificationRepository.save(notification);
        log.warn("All channels failed for notification {}", notification.getId());
    }

    private boolean tryDeliver(NotificationChannel channel, Notification notification) {
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                channel.send(notification);
                return true;
            } catch (NotificationDeliveryException ex) {
                log.warn("Channel {} attempt {} failed: {}", channel.getType(), attempt, ex.getMessage());
                if (attempt < 3) sleepBackoff(attempt);
            }
        }
        return false; // hết 3 lần, thử fallback channel kế tiếp
    }
}
```

`resolveChannels()` đọc `NotificationPreference` của user cho `eventType` này; nếu user chưa cấu hình gì, dùng default (ví dụ: `IN_APP, EMAIL`).

**Idempotency** (1F.3): trước khi dispatch, check `notificationRepository.existsByEventId(notification.getEventId())` đã `SENT` chưa — nếu rồi thì skip, tránh gửi trùng khi `NotificationEventListener` bị trigger lại (ví dụ do retry ở tầng khác).

## Bước 8 — Settings UI (1F.4)

`GET/PUT /notifications/preferences` — trả về + cập nhật list `NotificationPreference` của user hiện tại. Frontend: trang cài đặt cho user chọn "loại thông báo" × "kênh" (checkbox grid).

## Config tổng hợp cần thêm vào `application.properties`

```properties
# Email
spring.mail.host=${MAIL_HOST:smtp.gmail.com}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME:}
spring.mail.password=${MAIL_PASSWORD:}

# Telegram
app.telegram.bot-token=${TELEGRAM_BOT_TOKEN:}
app.telegram.bot-username=${TELEGRAM_BOT_USERNAME:}

# SMS (Phase 1B, thêm khi có provider thật)
app.sms.provider=${SMS_PROVIDER:twilio}
app.sms.api-key=${SMS_API_KEY:}
```

## Testing checklist

- [ ] Unit test `NotificationDispatcher` với `NotificationChannel` mock — verify fallback logic (channel 1 throw → channel 2 được gọi).
- [ ] Unit test idempotency — publish cùng `eventId` 2 lần, verify chỉ dispatch 1 lần.
- [ ] Integration test Email: dùng `GreenMail` (in-memory SMTP server cho test) — không gọi SMTP thật trong CI.
- [ ] Integration test Telegram: mock `RestClient`/`RestTemplate` — không gọi Telegram API thật trong CI.
- [ ] Test thủ công (không phải CI): tạo bot Telegram thật, link account thật qua deep-link, trigger 1 event thật (đổi CV status), confirm nhận được message trên Telegram.
- [ ] Test API `/notifications/*` bằng Postman/curl — check `ApiResponse<T>` shape đúng chuẩn.

## Definition of Done

- [ ] Đổi CV status → user nhận được **cả** in-app notification (query `GET /notifications` thấy record mới) **và** Telegram message (nếu đã liên kết) hoặc Email (nếu chưa liên kết Telegram, fallback đúng).
- [ ] `NotificationPreference` UI cho phép user tự chọn kênh, Dispatcher tôn trọng lựa chọn đó.
- [ ] Không gọi API bên ngoài thật nào trong test suite CI.

## Rủi ro / lưu ý

- SMTP thật (Gmail) có rate limit — dùng SendGrid/Mailgun free tier cho production thay vì Gmail SMTP cá nhân.
- `telegramChatId` là dữ liệu cá nhân — chỉ lưu khi user chủ động bấm liên kết, có nút "Hủy liên kết" set lại `null`.
- Đừng để 1 channel lỗi (ví dụ Telegram rate-limit) làm chậm toàn bộ hệ thống — timeout ngắn (3-5s) cho mọi HTTP call ra ngoài trong channel `send()`.
