APP=ft_pong
PORT=8443

DOCKER_COMPOSE := docker-compose

HOST_LAN_IP := $(shell hostname -I 2>/dev/null | awk '{print $$1}')


ifeq ($(HOST_LAN_IP),)
HOST_LAN_IP := $(shell ip -4 addr show 2>/dev/null | grep -oE "inet [0-9.]+" | awk '{print $$2}' | grep -v "^127" | head -n 1)
endif

ifeq ($(HOST_LAN_IP),)
HOST_LAN_IP := localhost
endif


export HOST_LAN_IP


.PHONY: build run clean logs stop restart detach backend frontend status re

run:
	@echo "🚀 Using HOST_LAN_IP=$(HOST_LAN_IP)"
	$(DOCKER_COMPOSE) up --build

build:
	@echo "🚀 Using HOST_LAN_IP=$(HOST_LAN_IP)"
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
	@echo "🚀 Using HOST_LAN_IP=$(HOST_LAN_IP)"
	$(DOCKER_COMPOSE) up --build -d

backend:
	@echo "🚀 Using HOST_LAN_IP=$(HOST_LAN_IP)"
	$(DOCKER_COMPOSE) up backend

frontend:
	@echo "🚀 Using HOST_LAN_IP=$(HOST_LAN_IP)"
	$(DOCKER_COMPOSE) up frontend

status:
	docker ps

re: stop run
