# Estágio de Build
FROM node:20-alpine AS builder
WORKDIR /app

ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV HTTP_PROXY=$HTTP_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Estágio de Produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV PORT=3000
COPY package*.json ./
RUN npm install --production

# Copia tanto o servidor compilado quanto a pasta dist do frontend
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.cjs"]