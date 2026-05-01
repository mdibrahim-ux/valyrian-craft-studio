# Build stage
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 🔥 FIX: increase Node memory
ENV NODE_OPTIONS="--max-old-space-size=1024"

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=0 /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]