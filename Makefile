APP=ft_pong
PORT=8443

# Auto-detect Compose command: prefer 'docker compose', fallback to 'docker-compose'
DOCKER_COMPOSE := $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; \
                      elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; \
                      else echo "MISSING"; fi)

ifeq ($(DOCKER_COMPOSE),MISSING)
$(error Docker Compose not found. Install Docker Desktop (with WSL integration) or \
       'sudo apt-get install docker-compose-plugin' on Ubuntu to get 'docker compose')
endif

.PHONY: build run clean logs stop restart detach backend frontend status

run:
	$(DOCKER_COMPOSE) up --build

build:
	$(DOCKER_COMPOSE) build

stop:
	$(DOCKER_COMPOSE) down

logs:
	$(DOCKER_COMPOSE) logs -f

clean:
	$(DOCKER_COMPOSE) down -v --rmi all
	docker system prune -f

restart:
	$(DOCKER_COMPOSE) restart

detach:
	$(DOCKER_COMPOSE) up --build -d

backend:
	$(DOCKER_COMPOSE) up backend

frontend:
	$(DOCKER_COMPOSE) up frontend

status:
	docker ps
