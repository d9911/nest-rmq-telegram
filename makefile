.PHONY: up down build logs restart clean shell-rmq test build-services init-nest dev check-env

# Warning check if .env file is missing
check-env:
	@if [ ! -f .env ]; then \
		echo "$(COLOR_YELLOW)==================================================$(COLOR_RESET)"; \
		echo "$(COLOR_RED)$(COLOR_BOLD)⚠️  WARNING: .env file is missing!$(COLOR_RESET)"; \
		echo "$(COLOR_YELLOW)Please create a .env file from .env.example$(COLOR_RESET)"; \
		echo "$(COLOR_YELLOW)to configure your Telegram Bot Token and Gemini API Key.$(COLOR_RESET)"; \
		echo "$(COLOR_YELLOW)Command to copy example:$(COLOR_RESET) cp .env.example .env"; \
		echo "$(COLOR_YELLOW)==================================================$(COLOR_RESET)"; \
	fi

# Launch all services in background mode and automatically open in browser
up: check-env
	docker-compose up -d
	@echo "Launching application in default browser..."
	@sleep 2
	@open http://localhost:3000 || start http://localhost:3000 || xdg-open http://localhost:3000 || true

# Start backend + frontend services in Docker and stream all logs in terminal
dev: check-env
	docker-compose up -d
	@echo "Launching application in default browser..."
	@(sleep 2 && (open http://localhost:3000 || start http://localhost:3000 || xdg-open http://localhost:3000 || true)) &
	docker-compose logs -f

# Stop all docker containers and networks
down:
	docker-compose down

# Rebuild all microservice Docker images
build:
	docker-compose build

# Clean and completely rebuild the Docker setup, opening browser when ready
up-build: check-env
	docker-compose up --build -d
	@echo "Launching application in default browser..."
	@sleep 2
	@open http://localhost:3000 || start http://localhost:3000 || xdg-open http://localhost:3000 || true

# Stream real-time diagnostic logs from all services
logs:
	docker-compose logs -f

# Gracefully restart the entire ecosystem
restart: down up

# Verify test cases across all microservices
test:
	cd services/producer && npm run test
	cd services/consumer && npm run test

# Full purge of containers, networks, and RabbitMQ persistent volumes
clean:
	docker-compose down -v


#=============================local =============================
BACKEND_PORT=8001
FRONTEND_PORT=3000

clean-ports:
	@echo "Очищаем порты $(BACKEND_PORT) (Backend) и $(FRONTEND_PORT) (Frontend)..."
	-npx --yes kill-port $(BACKEND_PORT) $(FRONTEND_PORT) 5173 8000 5175

	# Цветное оформление
COLOR_RESET   := \033[0m
COLOR_BOLD    := \033[1m
COLOR_RED     := \033[31m
COLOR_GREEN   := \033[32m
COLOR_YELLOW  := \033[33m
COLOR_BLUE    := \033[34m
COLOR_MAGENTA := \033[35m
COLOR_CYAN    := \033[36m


install:
	@echo "Устанавливаем зависимости фронт..."
	yarn install
	@echo "Устанавливаем зависимости consumer..."
	cd services/consumer && yarn install
	@echo "Устанавливаем зависимости notification..."
	cd services/notification && yarn install
	@echo "Устанавливаем зависимости producer..."
	cd services/producer && yarn install

# Build all local NestJS microservices
build-services:
	@echo "Building consumer..."
	cd services/consumer && yarn run build
	@echo "Building notification..."
	cd services/notification && yarn run build
	@echo "Building producer..."
	cd services/producer && yarn run build

# Re-initialize NestJS CLI and configurations for all services if needed
init-nest:
	@echo "Initializing NestJS configuration files and CLI..."
	@for service in consumer notification producer; do \
		echo "Initializing services/$$service..." ; \
		printf '{\n  "compilerOptions": {\n    "module": "commonjs",\n    "declaration": true,\n    "removeComments": true,\n    "emitDecoratorMetadata": true,\n    "experimentalDecorators": true,\n    "allowSyntheticDefaultImports": true,\n    "target": "ES2021",\n    "sourceMap": true,\n    "outDir": "./dist",\n    "baseUrl": "./",\n    "incremental": true,\n    "skipLibCheck": true,\n    "strictNullChecks": false,\n    "noImplicitAny": false,\n    "strictBindCallApply": false,\n    "forceConsistentCasingInFileNames": false,\n    "noFallthroughCasesInSwitch": false\n  }\n}\n' > services/$$service/tsconfig.json ; \
		printf '{\n  "$$schema": "https://json.schemastore.org/nest-cli",\n  "collection": "@nestjs/schematics",\n  "sourceRoot": "src",\n  "compilerOptions": {\n    "deleteOutDir": true\n  }\n}\n' > services/$$service/nest-cli.json ; \
		cd services/$$service && yarn add -D @nestjs/cli && cd ../.. ; \
	done
	@echo "NestJS services successfully initialized!"