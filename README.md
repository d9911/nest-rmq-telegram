# NestJS & RabbitMQ Microservices Workspace

This repository houses a highly scalable, SOLID-compliant microservices ecosystem built on NestJS (with Fastify) with RabbitMQ message queuing and the Telegram Bot API.

## Architecture Highlights
1. **Separation of Concerns (SOLID)**: Each microservice represents a single domain:
   - **Producer**: Handles HTTP ingestion with Swagger OpenAPI specs, validates inputs, attaches UUID-based idempotency tokens, and pushes raw tasks definition.
   - **Consumer**: Receives tasks, applies business logic, handles failures with retries, and publishes resolved notification commands.
   - **Notification**: Consumes messages and integrates with external Telegram Webhook endpoints.
2. **Idempotency**: Message IDs are tracked using UUID v4.
3. **Resilience**: RabbitMQ channels utilize manual acknowledgements (`noAck: false`), recovering with requeueing/retry structures on error.

## Running the Ecosystem

### Prerequisites
- Docker & Docker Compose
- Node.js >= 20.0.0 (for local development)

### Quick Start
1. Edit your environment variables in `.env`:
   ```env
   TELEGRAM_BOT_TOKEN="your-bot-token-here"
   TELEGRAM_CHAT_ID="your-chat-id-here"
   ```
2. Boot up the entire architecture using the Makefile:
   ```bash
   make up
   ```
3. Access RabbitMQ Management Dashboard at [http://localhost:15672](http://localhost:15672) (guest:guest).
4. Access Producer Swagger Documentation at [http://localhost:3001/api/docs](http://localhost:3001/api/docs).
