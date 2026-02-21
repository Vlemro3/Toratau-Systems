# --- Стадия 1: Сборка ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ARG VITE_MOCK=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MOCK=$VITE_MOCK
RUN npm run build

# --- Стадия 2: Nginx для раздачи статики ---
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
