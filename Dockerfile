# ----------- Stage 1: build (Node) -----------
FROM node:20-alpine AS build
WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
# Для Vite нужны dev-зависимости, поэтому обычный npm ci:
RUN npm ci

# Копируем исходники и собираем
COPY . .
# Прокидываем базовый путь API в сборку (Vite переменная)
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# ----------- Stage 2: serve (nginx) -----------
FROM nginx:alpine
# Копируем сборку
COPY --from=build /app/dist /usr/share/nginx/html
# Наш конфиг для SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
