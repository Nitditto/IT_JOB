# Phase 3 — Outbound Webhooks & Telegram/Zalo Bot (2 chiều)

## Mục tiêu

Hai nhánh độc lập, làm theo thứ tự ưu tiên 3B → 3A → 3C:
- **3B**: Telegram bot nhận lệnh (`/status`, `/jobs`) và inline button (company duyệt/từ chối CV ngay trong Telegram).
- **3A**: outbound webhook chung cho hệ thống thứ 3 (kiểu Stripe/GitHub webhook) — company đăng ký URL, hệ thống POST event tới đó.
- **3C**: Zalo OA tương tác 2 chiều — làm sau cùng vì cần duyệt OA.

## Điều kiện tiên quyết

Phase 0 (event bus), Phase 1E (Telegram bot đã tồn tại, có `telegramChatId` map với Account).

## Kiến trúc / package structure

```
com.example.demo.bot.telegram
├── TelegramWebhookController.java     # nhận Update từ Telegram
├── TelegramCommandHandler.java        # xử lý /status, /jobs
└── TelegramCallbackHandler.java       # xử lý inline button (Duyệt/Từ chối)

com.example.demo.webhook
├── WebhookSubscription.java           # entity
├── WebhookSubscriptionController.java # CRUD subscription (company tự đăng ký)
├── WebhookDispatcher.java             # lắng nghe event, POST tới subscriber
└── WebhookDeliveryLog.java            # entity — log mỗi lần gửi

com.example.demo.bot.zalo              # làm sau (3C)
├── ZaloWebhookController.java
└── ZaloSignatureVerifier.java
```

## Phần 1 — 3B. Telegram Bot tương tác 2 chiều

### Bước 1 — Setup webhook (thay long-polling từ Phase 1E)

```
POST https://api.telegram.org/bot<token>/setWebhook
{
  "url": "https://<domain>/telegram/webhook",
  "secret_token": "<random string, lưu trong config>"
}
```
Chạy lệnh này 1 lần (script/curl thủ công, hoặc `@PostConstruct` gọi 1 lần khi app start ở môi trường có domain public — **không** setWebhook trỏ về `localhost` được, Telegram cần URL public HTTPS. Dev local dùng lại long-polling từ Phase 1E hoặc dùng ngrok để có URL public tạm).

### Bước 2 — `TelegramWebhookController`

```java
@RestController
@RequestMapping("/telegram")
@RequiredArgsConstructor
public class TelegramWebhookController {
    private final TelegramCommandHandler commandHandler;
    private final TelegramCallbackHandler callbackHandler;

    @Value("${app.telegram.secret-token}")
    private String expectedSecretToken;

    @PostMapping("/webhook")
    public ResponseEntity<Void> onUpdate(
            @RequestHeader("X-Telegram-Bot-Api-Secret-Token") String secretToken,
            @RequestBody TelegramUpdate update) {
        if (!expectedSecretToken.equals(secretToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (update.message() != null) commandHandler.handle(update.message());
        if (update.callbackQuery() != null) callbackHandler.handle(update.callbackQuery());
        return ResponseEntity.ok().build();
    }
}
```
`TelegramUpdate` là DTO map JSON Telegram gửi — chỉ cần field đang dùng (`message.text`, `message.chat.id`, `callback_query.data`, `callback_query.id`), không cần map hết field Telegram API docs.

**Endpoint này phải public** (không qua JWT filter) — thêm `/telegram/webhook` vào danh sách `permitAll()` trong `SecurityConfig`, nhưng bảo mật bằng `secret_token` header thay cho JWT (Telegram không biết JWT của hệ thống).

### Bước 3 — Lệnh `/status`, `/jobs`

```java
@Component
@RequiredArgsConstructor
public class TelegramCommandHandler {
    private final AccountRepository accountRepository;
    private final CVService cvService;
    private final TelegramSender telegramSender; // wrap gọi sendMessage, dùng lại logic từ TelegramNotificationChannel Phase 1E

    public void handle(TelegramMessage message) {
        Account account = accountRepository.findByTelegramChatId(message.chat().id())
            .orElse(null);
        if (account == null) {
            telegramSender.send(message.chat().id(), "Bạn chưa liên kết tài khoản. Vào Cài đặt trên web để lấy link liên kết.");
            return;
        }
        switch (extractCommand(message.text())) {
            case "/status" -> replyWithCvStatus(account, message.chat().id());
            case "/jobs" -> replyWithJobSuggestions(account, message.chat().id());
            default -> telegramSender.send(message.chat().id(), "Lệnh không hợp lệ. Dùng /status hoặc /jobs.");
        }
    }
}
```
Cần thêm `AccountRepository.findByTelegramChatId(Long chatId)` (đã có cột `telegramChatId` từ Phase 1E).

### Bước 4 — Inline button "Duyệt/Từ chối" cho company

Khi `NotificationEventListener` (Phase 1) gửi Telegram message báo "có CV mới" cho company, thêm `reply_markup` inline keyboard:
```java
Map<String, Object> body = Map.of(
    "chat_id", companyChatId,
    "text", "Ứng viên mới: " + cv.getName() + " ứng tuyển " + job.getName(),
    "reply_markup", Map.of("inline_keyboard", List.of(List.of(
        Map.of("text", "✅ Duyệt", "callback_data", "approve:" + job.getId() + ":" + account.getId()),
        Map.of("text", "❌ Từ chối", "callback_data", "reject:" + job.getId() + ":" + account.getId())
    )))
);
```
`TelegramCallbackHandler` parse `callback_data`, gọi lại đúng service đã có:
```java
@Component
@RequiredArgsConstructor
public class TelegramCallbackHandler {
    private final CVService cvService;
    private final TelegramSender telegramSender;

    public void handle(TelegramCallbackQuery query) {
        String[] parts = query.data().split(":"); // ["approve", "12", "34"]
        CVStatus newStatus = parts[0].equals("approve") ? CVStatus.APPROVED : CVStatus.REJECTED;
        cvService.updateCVStatus(Long.parseLong(parts[1]), Long.parseLong(parts[2]), newStatus);
        telegramSender.answerCallbackQuery(query.id(), "Đã cập nhật!"); // tắt loading spinner trên Telegram UI
        telegramSender.editMessageText(query.message().chat().id(), query.message().messageId(),
            query.message().text() + "\n\n" + (newStatus == CVStatus.APPROVED ? "✅ Đã duyệt" : "❌ Đã từ chối"));
    }
}
```
**Quan trọng — kiểm soát quyền:** `callback_data` chỉ chứa `jobId`/`accountId`, KHÔNG chứa company nào bấm — phải verify `query.from().id()` (Telegram user ID người bấm) tương ứng với company thật sự sở hữu job đó (`jobRepository.findById(jobId).getCompanyID()` phải khớp company đã liên kết `query.from().id()` qua Telegram). Nếu không check, company A có thể duyệt CV của company B nếu biết được callback_data (thực tế khó đoán nhưng đây vẫn là một lỗ hổng quyền cần chặn ở tầng service, không dựa vào "khó đoán").

## Phần 2 — 3A. Outbound Webhook chung

### Bước 1 — Entity `WebhookSubscription`

```java
@Entity
@Table(name = "webhook_subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class WebhookSubscription {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false)
    private Long companyId;         // raw ID — aggregate root rule

    @Column(nullable = false)
    private String targetUrl;

    @Column(nullable = false)
    private String secret;          // dùng để ký HMAC, generate random khi tạo, chỉ hiện 1 lần cho company copy

    @ElementCollection
    @CollectionTable(name = "webhook_subscription_events", joinColumns = @JoinColumn(name = "subscription_id"))
    @Column(name = "event_type")
    private Set<String> subscribedEvents;   // ví dụ {"job.created.v1", "cv.status_changed.v1"}

    private boolean active;
}
```

### Bước 2 — Event catalog có version

Định nghĩa hằng số string, KHÔNG dùng trực tiếp tên class Java (tên class có thể đổi khi refactor, string version không nên đổi):
```java
public final class WebhookEventTypes {
    public static final String JOB_CREATED_V1 = "job.created.v1";
    public static final String CV_STATUS_CHANGED_V1 = "cv.status_changed.v1";
}
```
Payload gửi đi là JSON cố định shape cho từng version — nếu sau này cần đổi field, tạo `job.created.v2` mới, giữ `v1` chạy song song cho subscriber cũ chưa migrate.

### Bước 3 — `WebhookDispatcher`

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookDispatcher {
    private final WebhookSubscriptionRepository subscriptionRepository;
    private final WebhookDeliveryLogRepository deliveryLogRepository;
    private final RestClient restClient;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onJobCreated(JobCreatedEvent event) {
        String payload = toJson(Map.of("jobId", event.jobId(), "companyId", event.companyId()));
        dispatchToSubscribers(event.companyId(), WebhookEventTypes.JOB_CREATED_V1, payload);
    }

    private void dispatchToSubscribers(Long companyId, String eventType, String payload) {
        List<WebhookSubscription> subs = subscriptionRepository
            .findByCompanyIdAndActiveTrueAndSubscribedEventsContaining(companyId, eventType);
        for (WebhookSubscription sub : subs) {
            deliverWithRetry(sub, eventType, payload);
        }
    }

    private void deliverWithRetry(WebhookSubscription sub, String eventType, String payload) {
        String signature = hmacSha256(sub.getSecret(), payload);
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                restClient.post().uri(sub.getTargetUrl())
                    .header("X-Signature", signature)
                    .header("X-Event-Type", eventType)
                    .body(payload)
                    .retrieve().toBodilessEntity();
                logDelivery(sub, eventType, "SUCCESS", attempt);
                return;
            } catch (Exception ex) {
                logDelivery(sub, eventType, "FAILED: " + ex.getMessage(), attempt);
                if (attempt < 3) sleepBackoff(attempt);
            }
        }
    }
}
```

### Bước 4 — API cho company tự quản lý subscription

```
POST   /webhooks/subscriptions          — tạo, trả secret 1 lần duy nhất trong response (không lưu lại được sau đó, giống Stripe)
GET    /webhooks/subscriptions          — list của company hiện tại
DELETE /webhooks/subscriptions/{id}
POST   /webhooks/subscriptions/{id}/test  — gửi 1 payload mẫu để company verify endpoint của họ nhận đúng
GET    /webhooks/deliveries?subscriptionId=...   — xem log (dùng ở Phase 7 Admin Dashboard nhiều hơn, nhưng company cũng nên tự xem được log của mình)
```

## Phần 3 — 3C. Zalo OA tương tác (làm sau cùng)

Tương tự 3B nhưng:
- Verify request bằng `mac` field (Zalo tự tính HMAC theo thuật toán riêng, xem Zalo OA API docs tại thời điểm implement — thuật toán có thể thay đổi theo version API, không hardcode giả định từ tài liệu cũ).
- Cần OA thật đã được duyệt tương tác — không test được nếu chưa có OA thật.
- Có thể tái sử dụng gần hết logic `TelegramCallbackHandler`/`TelegramCommandHandler` nếu extract phần chung ra 1 interface `ChatBotCommandHandler` — nhưng **không làm trước khi có Zalo OA thật để tránh over-engineer theo giả định sai**.

## Config cần thêm

```properties
app.telegram.secret-token=${TELEGRAM_WEBHOOK_SECRET:}
```

## Testing checklist

- [ ] Unit test `TelegramCallbackHandler` — verify company A không thể duyệt CV thuộc company B (test case cố tình gửi `callback_data` với `jobId` không thuộc về Telegram user gọi).
- [ ] Unit test `WebhookDispatcher.deliverWithRetry` — mock `RestClient` throw lỗi 2 lần rồi thành công lần 3, verify log đủ 3 entry.
- [ ] Unit test HMAC signature — verify signature tính ra khớp giá trị mong đợi cho 1 input cố định (regression test, tránh vô tình đổi thuật toán ký).
- [ ] Test tay: dùng `webhook.site` (free tool hiển thị request nhận được) làm `targetUrl` tạm, tạo job mới, xác nhận nhận đúng payload + signature.
- [ ] Test tay Telegram: bấm inline button "Duyệt" trên Telegram thật, xác nhận CV status đổi trong DB và message Telegram tự sửa thành "✅ Đã duyệt".

## Definition of Done

- [ ] `/status`, `/jobs` hoạt động qua Telegram thật.
- [ ] Company duyệt/từ chối CV qua inline button, có kiểm tra quyền đúng company.
- [ ] Company tự tạo được webhook subscription, nhận được event thật kèm signature hợp lệ.
- [ ] Log delivery đầy đủ, company/admin xem được lịch sử gửi.

## Rủi ro / lưu ý

- Webhook target URL do company tự nhập — **validate không cho trỏ vào địa chỉ nội bộ** (`localhost`, `127.0.0.1`, IP private range `10.x`/`172.16-31.x`/`192.168.x`) để tránh SSRF (company lợi dụng hệ thống để tự bắn request vào hạ tầng nội bộ của chính mình hoặc dò mạng nội bộ).
- Secret webhook chỉ hiện 1 lần khi tạo — nếu company mất, phải tạo subscription mới (không có API "xem lại secret cũ"), giống thông lệ Stripe/GitHub.
- Timeout ngắn (5s) cho mọi request outbound — company có endpoint chậm không được làm nghẽn hàng đợi dispatch của hệ thống.
