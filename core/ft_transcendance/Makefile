APP=ft_pong
PORT=8443

.PHONY: build run clean

build:
	docker build -t $(APP) .

run: build
	docker rm -f $(APP)-ctr 2>/dev/null || true
	docker run --name $(APP)-ctr -p $(PORT):443 -p 8080:80 $(APP)
	@echo "\nOpen https://localhost:$(PORT) (accept the self-signed cert)."

clean:
	docker rm -f $(APP)-ctr 2>/dev/null || true
	docker rmi $(APP) 2>/dev/null || true
