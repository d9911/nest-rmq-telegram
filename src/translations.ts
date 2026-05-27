export type Language = 'en' | 'ru';

export interface TranslationDict {
  // Navigation & Header
  workspaceTitle: string;
  interactivePlayground: string;
  sourceCodeIde: string;
  documentation: string;
  liveBotConfigured: string;
  configureLiveBot: string;
  copySourceCodeBtn: string;
  
  // Hero
  heroTechBadge: string;
  heroHeaderFirst: string;
  heroHeaderAccent: string;
  heroDesc: string;
  runSignalBtn: string;
  browseCodeBtn: string;

  // Bot Config Dialog
  botDialogTitle: string;
  botSecureLabel: string;
  botTokenLabel: string;
  botTokenPlaceholder: string;
  botChatIdLabel: string;
  botChatIdPlaceholder: string;
  botChatIdDesc: string;
  botSaveBtn: string;
  botSavingBtn: string;
  botClearBtn: string;

  // Workflow chart nodes
  architectureTitle: string;
  brokerNetworkOnline: string;
  producerNodeTitle: string;
  producerNodeDesc: string;
  producerExchangeLabel: string;
  producerTotalDispatched: string;
  brokerNodeTitle: string;
  brokerNodeDesc: string;
  brokerTasksQueue: string;
  brokerNotifyQueue: string;
  brokerDLXCount: string;
  consumerNodeTitle: string;
  consumerNodeDesc: string;
  consumerQueueLabel: string;
  consumerAckNackLabel: string;
  telegramGatewayTitle: string;
  telegramGatewayDesc: string;
  telegramStatusLabel: string;
  telegramStatusIdle: string;
  telegramStatusSimulated: string;
  telegramStatusSuccess: string;
  telegramStatusFailed: string;
  telegramConfigLabel: string;
  telegramConfigReal: string;
  telegramConfigSandbox: string;

  // Message Ingestion Form
  ingestPayloadTitle: string;
  producerApiLabel: string;
  messageEventTitle: string;
  payloadNotificationMessage: string;
  contextJsonMetadata: string;
  publishEventBtn: string;

  // Subscribers roster
  subscribersRosterTitle: string;
  subscribersSubtitle: string;
  subscribersEmpty: string;
  subscribersHelp: string;
  subscribersManualRegisterTitle: string;
  subscribersManualChatIdPlaceholder: string;
  subscribersManualNamePlaceholder: string;
  subscribersManualAddBtn: string;
  subscribersManualAddingBtn: string;

  // Consumer Settings (Fault Deck)
  faultDeckTitle: string;
  faultDeckLabel: string;
  manualAckTitle: string;
  manualAckDesc: string;
  simulateErrTitle: string;
  simulateErrDesc: string;
  consumerLatencyLabel: string;

  // Queue Monitor
  brokerMonitorTitle: string;
  brokerMonitorSubtitle: string;
  brokerMonitorEmpty: string;
  brokerRetryTag: string;
  brokerMetadataLabel: string;
  brokerStatusIntake: string;
  brokerStatusRouting: string;
  brokerStatusWorker: string;
  brokerStatusAck: string;
  brokerStatusNack: string;
  brokerStatusDead: string;

  // STDOUT console
  stdoutTitle: string;
  stdoutClearBtn: string;
  stdoutEmpty: string;

  // Virtual phone mockup block
  virtualPhoneHeaderBadge: string;
  virtualPhoneTitle: string;
  virtualPhoneDesc: string;
  virtualPhoneSetupGuideTitle: string;
  virtualPhoneGuideStep1: string;
  virtualPhoneGuideStep2: string;
  virtualPhoneGuideStep3: string;
  phoneBotTitle: string;
  phoneBotUsername: string;
  phoneBotAwaiting: string;
  phoneReadOnlyConsole: string;

  // Code IDE tab
  codeIdeHeaderTitle: string;
  codeIdeHeaderDesc: string;
  codeCopyBtn: string;
  codeCopiedBtn: string;
  fileTreeTitle: string;
  fileTreeConfigsGroup: string;

  // Documentation tab
  docsManifestoBadge: string;
  docsManifestoTitle: string;
  docsManifestoDesc: string;
  docsInspectBtn: string;
  docsIdempotencyTitle: string;
  docsIdempotencyDesc: string;
  docsIdempotencyStep1: string;
  docsIdempotencyStep2: string;
  docsIdempotencyStep3: string;
  docsErrorRecoveryTitle: string;
  docsErrorRecoveryDesc: string;
  docsErrorRecoveryStep1: string;
  docsErrorRecoveryStep2: string;
  docsErrorRecoveryStep3: string;
  docsDockerTitle: string;
  docsDockerDesc: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    workspaceTitle: "NestJS Microservices Workspace",
    interactivePlayground: "Interactive Playground",
    sourceCodeIde: "Source Code IDE",
    documentation: "Documentation",
    liveBotConfigured: "Live Bot Configured",
    configureLiveBot: "Configure Live Bot",
    copySourceCodeBtn: "Copy Source Code",

    heroTechBadge: "NestJS • RabbitMQ • Telegram Bot API • Fastify",
    heroHeaderFirst: "Enterprise Microservice",
    heroHeaderAccent: "Ecosystem",
    heroDesc: "A professionally architected, SOLID-compliant backend using NestJS, decoupled via RabbitMQ direct queue brokers, and delivering telemetry streams to the Telegram API. Configure, run, and step-debug the entire pipeline inside this interactive panel.",
    runSignalBtn: "Run Signal Simulation",
    browseCodeBtn: "Browse Code Workspace",

    botDialogTitle: "Telegram API Real Dispatcher",
    botSecureLabel: "Secure Storage: Your Bot API Token is stored strictly local in your web browser (localStorage). It is never sent to any external server except directly to the official api.telegram.org webhook!",
    botTokenLabel: "Telegram Bot Token",
    botTokenPlaceholder: "e.g. 123456789:ABCDefGhIJKlmNoPQRsTUVwX...",
    botChatIdLabel: "Target Chat ID / Chat user ID",
    botChatIdPlaceholder: "e.g. -10012345678 or 987654321",
    botChatIdDesc: "You can get your Chat ID by messaging the bot @userinfobot in Telegram.",
    botSaveBtn: "Save Configuration",
    botSavingBtn: "Saving...",
    botClearBtn: "Clear Keys",

    architectureTitle: "Live Microservices Architecture Data Flow",
    brokerNetworkOnline: "Broker Network Online",
    producerNodeTitle: "1. Producer REST Service",
    producerNodeDesc: "Ingests payload, wraps with idempotent UUIDv4, serializes data, publishes to:",
    producerExchangeLabel: "exchange: amq.direct",
    producerTotalDispatched: "Total Dispatched",
    brokerNodeTitle: "2. RabbitMQ Broker",
    brokerNodeDesc: "Saves task envelopes in durable queues. Acknowledges transmission.",
    brokerTasksQueue: "tasks_queue:",
    brokerNotifyQueue: "notify_queue:",
    brokerDLXCount: "DLX / Dead-Letters",
    consumerNodeTitle: "3. Consumer Service",
    consumerNodeDesc: "Listens to queue, performs processing, triggers manual/auto ACK, dispatches to:",
    consumerQueueLabel: "queue: notify_queue",
    consumerAckNackLabel: "ACK / NACK Count",
    telegramGatewayTitle: "4. Telegram Gateway",
    telegramGatewayDesc: "Transfers refined payloads direct web request endpoints to Telegram servers.",
    telegramStatusLabel: "Status:",
    telegramStatusIdle: "Ready & Silent",
    telegramStatusSimulated: "Simulated Delivered",
    telegramStatusSuccess: "SUCCESS: Alert Fired!",
    telegramStatusFailed: "Transport Error",
    telegramConfigLabel: "Config Status",
    telegramConfigReal: "⚡ Real Delivery Active",
    telegramConfigSandbox: "Sandbox (Simulated)",

    ingestPayloadTitle: "Ingest HTTP Payload",
    producerApiLabel: "Producer API",
    messageEventTitle: "Message Event Title",
    payloadNotificationMessage: "Payload Notification Message",
    contextJsonMetadata: "Context JSON Metadata",
    publishEventBtn: "Publish Event (POST request)",

    subscribersRosterTitle: "Live Active Receivers",
    subscribersSubtitle: "Choose select recipients from the live registered sessions below. If nobody is ticked, the message broadcasts to everyone currently registered!",
    subscribersEmpty: "No subscriber sessions found.",
    subscribersHelp: "Send /start or start to the bot @TextAnalyzertbot (or your configured bot) to connect instantly!",
    subscribersManualRegisterTitle: "Register Recipient Manually",
    subscribersManualChatIdPlaceholder: "Numeric Chat ID",
    subscribersManualNamePlaceholder: "Custom Name",
    subscribersManualAddBtn: "Add Recipient",
    subscribersManualAddingBtn: "Registering...",

    faultDeckTitle: "Fault & Ack Deck",
    faultDeckLabel: "Consumer Settings",
    manualAckTitle: "Manual Acknowledgement Mode",
    manualAckDesc: "Wait for explicit channel.ack() approval.",
    simulateErrTitle: "Simulate Processing Exception",
    simulateErrDesc: "Triggers DB failure to test manual NACK with Requeues & dead-letter!",
    consumerLatencyLabel: "Consumer Latency Delay:",

    brokerMonitorTitle: "Broker Envelopes Monitor",
    brokerMonitorSubtitle: "Durable Broker State",
    brokerMonitorEmpty: "No active message bundles in brokers queue.",
    brokerRetryTag: "Retry",
    brokerMetadataLabel: "Metadata:",
    brokerStatusIntake: "📥 Queue Intake",
    brokerStatusRouting: "🔄 Routing...",
    brokerStatusWorker: "⚙️ Active Worker",
    brokerStatusAck: "✅ ACK Confirm",
    brokerStatusNack: "❌ NACK Purge",
    brokerStatusDead: "💀 Dead Letter",

    stdoutTitle: "Microservices STDOUT (System Unified Logs)",
    stdoutClearBtn: "CLEAR",
    stdoutEmpty: "No new streams registered.",

    virtualPhoneHeaderBadge: "Integrated Bot API Module Client",
    virtualPhoneTitle: "Virtual Sandbox Telegram Client",
    virtualPhoneDesc: "When messages are successfully processed by nest-consumer, a callback event executes on the Telegram Bot integration layer. By default, messages populate this real-time sandbox phone on the right. Want them delivered live on your cellular phone? Click Configure Live Bot in the corner to integrate a real key instantly!",
    virtualPhoneSetupGuideTitle: "Real Telegram Channel Setup Guide",
    virtualPhoneGuideStep1: "Open Telegram app and message @BotFather to register a new bot and grab the Token.",
    virtualPhoneGuideStep2: "Message the bot @userinfobot to grab your unique Numeric Chat ID.",
    virtualPhoneGuideStep3: "Enter them into the Configure Live Bot option above!",
    phoneBotTitle: "Microservice Alert Bot",
    phoneBotUsername: "@nest_rmq_notification_bot",
    phoneBotAwaiting: "Awaiting triggers from queue...",
    phoneReadOnlyConsole: "ReadOnly Sandbox Console",

    codeIdeHeaderTitle: "NestJS Web Ide & Microservices Workspace",
    codeIdeHeaderDesc: "This folder structure displays pristine production components obeying SOLID design patterns. Choose a file below to explore and clone.",
    codeCopyBtn: "Copy Code",
    codeCopiedBtn: "Copied!",
    fileTreeTitle: "Project Files Tree",
    fileTreeConfigsGroup: "Workspace Configs",

    docsManifestoBadge: "SOLID & SOLID-Clean Principles Architecture",
    docsManifestoTitle: "Microservices Architecture Manifesto",
    docsManifestoDesc: "We decouple our services following single responsibilities. The Producer Service does not share data structures, file layers, or memory space with the Consumer; they synchronize entirely through standard AMQP streams. This creates zero point bottlenecks, massive horizontal scaling options, and robust error fallback.",
    docsInspectBtn: "Inspect Files Tree",
    docsIdempotencyTitle: "Idempotency Mechanisms",
    docsIdempotencyDesc: "In distributed systems, networks can drop, duplicate, or re-deliver packets. Our architecture guarantees idempotency:",
    docsIdempotencyStep1: "Every ingested event triggers a unique UUID generated by the Producer.",
    docsIdempotencyStep2: "The database or Consumer caches these transaction signatures during processing.",
    docsIdempotencyStep3: "Duplicate packages arriving with active matching GUID tokens are automatically skipped or served from cache, preventing duplicate alerts to the customer.",
    docsErrorRecoveryTitle: "Broker Error Recovery & Requeuing",
    docsErrorRecoveryDesc: "What happens when third-party servers (like Telegram Bot endpoints) collapse temporarily?",
    docsErrorRecoveryStep1: "With noAck: false, RabbitMQ preserves the message until the Consumer sends an explicit ack code.",
    docsErrorRecoveryStep2: "If operations fail, we issue a nack with requeue: true, putting the message back to try again later.",
    docsErrorRecoveryStep3: "After 3 retry failures, we discard or direct messages to a Dead-Letter Queue (DLX) for operator debugging and diagnostics, keeping queues clean.",
    docsDockerTitle: "Docker-Compose Deployment Guide",
    docsDockerDesc: "We use Docker Compose to bind all microservices and dependency networks under a single operational environment. To launch the whole project locally:"
  },
  ru: {
    workspaceTitle: "Микросервисы NestJS на RabbitMQ",
    interactivePlayground: "Интерактивная панель",
    sourceCodeIde: "Исходный код (IDE)",
    documentation: "Архитектура и доки",
    liveBotConfigured: "Активный Бот включен",
    configureLiveBot: "Настроить Telegram-бота",
    copySourceCodeBtn: "Копировать проект",

    heroTechBadge: "NestJS • RabbitMQ • Telegram Bot API • Fastify • ИИ Gemini 3.5-flash",
    heroHeaderFirst: "Промышленная экосистема",
    heroHeaderAccent: "Микросервисов",
    heroDesc: "Профессионально спроектированная, SOLID-ориентированная архитектура с использованием NestJS, разделенная через брокер сообщений RabbitMQ с прямой очередью (Direct Queue) и отправкой событий телеметрии в Telegram Bot API. Запускайте сценарии и просматривайте пошаговые логи прямо в реальном времени.",
    runSignalBtn: "Запустить имитацию сигнала",
    browseCodeBtn: "Просмотр файлов проекта",

    botDialogTitle: "Подключение живого Telegram бота",
    botSecureLabel: "🔒 Безопасное хранилище: Ваш токен бот-API сохраняется исключительно локально в браузере (localStorage). Он никогда не передается третьим лицам и используется только для прямой отправки запросов на api.telegram.org!",
    botTokenLabel: "Токен бота (Telegram Bot Token)",
    botTokenPlaceholder: "например, 123456789:ABCDefGhIJKlmNoPQRsTUVwX...",
    botChatIdLabel: "Chat ID получателя (по умолчанию)",
    botChatIdPlaceholder: "например, -10012345678 или 987654321",
    botChatIdDesc: "Вы можете быстро получить свой Chat ID, отправив любое сообщение боту @userinfobot Телеграме.",
    botSaveBtn: "Сохранить настройки",
    botSavingBtn: "Сохранение...",
    botClearBtn: "Удалить ключи",

    architectureTitle: "Визуализация архитектуры потоков данных",
    brokerNetworkOnline: "Брокер RabbitMQ активен",
    producerNodeTitle: "1. Сервис API (Producer)",
    producerNodeDesc: "Принимает входящее событие, снабжает его уникальным UUIDv4 для идемпотентности и отправляет в एक्सचेंज:",
    producerExchangeLabel: "exchange: amq.direct",
    producerTotalDispatched: "Отправлено событий",
    brokerNodeTitle: "2. Брокер RabbitMQ",
    brokerNodeDesc: "Управляет надежным хранением конвертов сообщений в независимых очередях.",
    brokerTasksQueue: "tasks_queue:",
    brokerNotifyQueue: "notify_queue:",
    brokerDLXCount: "Очередь брака DLX (Dead-Letter)",
    consumerNodeTitle: "3. Обработчик (Consumer)",
    consumerNodeDesc: "Слушает входящую очередь брокера, выполняет полезное действие, контролирует ручное подтверждение (ACK) и пересылает в:",
    consumerQueueLabel: "queue: notify_queue",
    consumerAckNackLabel: "Счётчики подтверждений ACK/NACK",
    telegramGatewayTitle: "4. Шлюз уведомлений",
    telegramGatewayDesc: "Транспортирует подготовленные данные через прокси-запросы в официальный API Telegram.",
    telegramStatusLabel: "Статус отправки:",
    telegramStatusIdle: "Ожидание сигналов",
    telegramStatusSimulated: "Успешно симулировано в песочнице",
    telegramStatusSuccess: "Доставлено на реальные устройства!",
    telegramStatusFailed: "Ошибка транспорта Telegram API",
    telegramConfigLabel: "Режим доставки",
    telegramConfigReal: "⚡ Живая отправка активна",
    telegramConfigSandbox: "Песочница (Симуляция)",

    ingestPayloadTitle: "Инициировать HTTP-событие",
    producerApiLabel: "Интерфейс продюсера",
    messageEventTitle: "Заголовок сообщения (Event Title)",
    payloadNotificationMessage: "Текст полезной нагрузки (Notification)",
    contextJsonMetadata: "Метаданные события (JSON Metadata)",
    publishEventBtn: "Опубликовать событие (POST запрос)",

    subscribersRosterTitle: "Активные получатели в Telegram",
    subscribersSubtitle: "Выберите конкретных получателей из зарегистрированных сессий. Если никто не выбран, бот разошлет оповещения ВСЕМ участникам!",
    subscribersEmpty: "Список сессий пуст.",
    subscribersHelp: "Напишите /start или любое сообщение боту @TextAnalyzertbot (или вашему настроенному боту), чтобы мгновенно подключить это устройство!",
    subscribersManualRegisterTitle: "Зарегистрировать получателя вручную",
    subscribersManualChatIdPlaceholder: "Числовой Chat ID",
    subscribersManualNamePlaceholder: "Произвольное имя",
    subscribersManualAddBtn: "Добавить получателя",
    subscribersManualAddingBtn: "Регистрация...",

    faultDeckTitle: "Стенд отказоустойчивости и ACK-подтверждений",
    faultDeckLabel: "Настройки потребителя сообщений",
    manualAckTitle: "Режим ручного подтверждения (Manual ACK)",
    manualAckDesc: "Ждать от обработчика явного вызова channel.ack() для изъятия из очереди.",
    simulateErrTitle: "Имитировать ошибку базы данных",
    simulateErrDesc: "Провоцирует аварийную ситуацию для проверки авто-повтора NACK, возврата в очередь и перехода в DLX!",
    consumerLatencyLabel: "Искусственная задержка (мс):",

    brokerMonitorTitle: "Диспетчер конвертов RabbitMQ",
    brokerMonitorSubtitle: "Состояние брокера очередей в реальном времени",
    brokerMonitorEmpty: "Очереди брокера свободны. Новых сообщений нет.",
    brokerRetryTag: "Попытка",
    brokerMetadataLabel: "Метаданные:",
    brokerStatusIntake: "📥 Поступило в очередь",
    brokerStatusRouting: "🔄 Направляется...",
    brokerStatusWorker: "⚙️ В обработке воркером",
    brokerStatusAck: "✅ ACK подтверждён",
    brokerStatusNack: "❌ NACK отклонён",
    brokerStatusDead: "💀 Списано в Dead Letter",

    stdoutTitle: "Логи вывода консоли STDOUT (Unified Logs)",
    stdoutClearBtn: "ОЧИСТИТЬ LОГИ",
    stdoutEmpty: "Логи пусты. Запустите симуляцию событий.",

    virtualPhoneHeaderBadge: "Интегрированный клиент Bot API",
    virtualPhoneTitle: "Имитационный Telegram-клиент",
    virtualPhoneDesc: "При успешной обработке в nest-consumer, событие триггерит отправку отладочных данных в Telegram Bot. По умолчанию сообщения доставляются на симулируемый смартфон справа. Чтобы получать их на свой физический телефон, наберите Настроить Telegram-бота вверху и введите настоящие ключи!",
    virtualPhoneSetupGuideTitle: "Руководство по запуску с вашим ботом",
    virtualPhoneGuideStep1: "Найдите бота @BotFather в Telegram, отправьте команду /newbot и скопируйте выданный Token.",
    virtualPhoneGuideStep2: "Напишите полезному боту @userinfobot, чтобы прочитать свой персональный Chat ID.",
    virtualPhoneGuideStep3: "Вставьте эти параметры в окно настройки бота в правом углу панели!",
    phoneBotTitle: "Бот уведомлений микросервисов",
    phoneBotUsername: "@nest_rmq_notification_bot",
    phoneBotAwaiting: "Ожидание событий из RabbitMQ...",
    phoneReadOnlyConsole: "Песочница Telegram (Только чтение)",

    codeIdeHeaderTitle: "Веб-интегрированная среда разработки проектов",
    codeIdeHeaderDesc: "Дерево файлов полностью иллюстрирует каноническую структуру NestJS-сервисов с соблюдением принципов абстракции и инверсии зависимостей. Кликните на файл, чтобы просмотреть исходный код.",
    codeCopyBtn: "Копировать код",
    codeCopiedBtn: "Скопировано!",
    fileTreeTitle: "Структура дерева файлов",
    fileTreeConfigsGroup: "Конфигурация инфраструктуры",

    docsManifestoBadge: "Архитектура SOLID & Clean Architecture",
    docsManifestoTitle: "Манифест распределенных приложений",
    docsManifestoDesc: "Наши микросервисы абсолютно изолированы и независимы в рамках Single Responsibility. Сервис API-продюсера не разделяет базы данных, файловые хранилища или оперативную память с сервисом Consumer; синхронизация выполняется исключительно через децентрализованные стримы брокера RabbitMQ AMQP. Это устраняет единую точку отказа и обеспечивает горизонтальное масштабирование.",
    docsInspectBtn: "Перейти к коду",
    docsIdempotencyTitle: "Обеспечение идемпотентности",
    docsIdempotencyDesc: "В крупных сетях пакеты могут задерживаться, теряться или доставляться повторно. Наш воркер гарантирует абсолютную безопасность от дублирования следующим образом:",
    docsIdempotencyStep1: "Каждое сетевое событие снабжается уникальным GUID/UUID маркером на стороне API-продюсера.",
    docsIdempotencyStep2: "Потребитель регистрирует и кэширует выполненные события в транзакционной таблице базы данных.",
    docsIdempotencyStep3: "Случайные дубликаты транзакций с уже обработанным GUID отсекаются обработчиком на ранних этапах без выполнения побочных эффектов или повторных рассылок клиентам.",
    docsErrorRecoveryTitle: "Обработка сетевых аварий и зависаний",
    docsErrorRecoveryDesc: "Что происходит, если внешние сервера (например, Telegram Bot API) временно перестают отвечать на запросы воркера?",
    docsErrorRecoveryStep1: "За счёт флага noAck: false, брокер RabbitMQ не стирает сообщение до тех пор, пока консьюмер не пришлет явный код успеха ack.",
    docsErrorRecoveryStep2: "В случае ошибки мы делаем nack с параметром requeue: true, бережно возвращая задание в голову очереди для повтора.",
    docsErrorRecoveryStep3: "После 3-х неудачных попыток во избежание «зависания» всей очереди, сообщение отправляется в Dead-Letter Exchange (DLX) для ручной диагностики администратором.",
    docsDockerTitle: "Инструкция по развертыванию через Docker-Compose",
    docsDockerDesc: "Мы используем технологию Docker Compose для объединения всех микросервисов и инфраструктуры в единый виртуальный контур. Для локального запуска проекта:"
  }
};
