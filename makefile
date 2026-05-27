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
