# =======================================================
# Dockerfile Multi-Stage para AppEquipScanHub
# Servidor de Destino: 10.119.13.58 | Porta: 3000
# Integration API: LiteLLM (10.121.243.101:8083/v1)
# =======================================================

# Stage 1: Build Phase
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifests de pacotes
COPY package.json package-lock.json* ./

# Instalar dependências completas para o build
RUN npm ci || npm install

# Copiar código fonte completo
COPY . .

# Compilar aplicação para produção (Vite + esbuild CJS server)
RUN npm run build

# Stage 2: Runtime Production Phase
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar manifestos e dependências de produção
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production

# Copiar a pasta dist compilada do estágio de build
COPY --from=builder /app/dist ./dist

# Expor a porta 3000 do container
EXPOSE 3000

# Comando de inicialização do servidor
CMD ["node", "dist/server.cjs"]
