.PHONY: up down build logs restart clean shell-rmq test

# Launch all microservices, RabbitMQ, and frontends in background mode
up:
	docker-compose up -d

# Stop all docker containers and networks
down:
	docker-compose down

# Rebuild all microservice Docker images
build:
	docker-compose build

# Clean and completely rebuild the Docker setup
up-build:
	docker-compose up --build -d

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