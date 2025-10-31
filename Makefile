APP=ft_pong
PORT=8443

.PHONY: build run clean logs stop restart

run:
	docker-compose up --build


build:
	docker-compose build


stop:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --rmi all
	docker system prune -f

restart:
	docker-compose restart

detach:
	docker-compose up --build -d

backend:
	docker-compose up backend

frontend:
	docker-compose up frontend

status:
	docker ps
