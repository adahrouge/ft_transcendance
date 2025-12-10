FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN mkdir -p certs && \
    openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem \
    -days 365 -nodes -subj "/CN=localhost"

EXPOSE 8443

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "8443"]
