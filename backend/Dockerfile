# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /build

RUN addgroup -S appuser && adduser -S appuser -G appuser -u 1001

COPY package*.json ./
RUN npm install

COPY . .
RUN chown -R 1001:1001 /build

# --- Runtime Stage ---
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

COPY --from=builder /build ./

USER 1001:1001

EXPOSE 5000

CMD ["server.js"]