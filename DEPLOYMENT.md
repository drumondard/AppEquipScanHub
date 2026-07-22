# Guia de Implantação e Deploy - AppEquipScanHub

Este guia detalha o procedimento para implantar o **AppEquipScanHub** no servidor **10.119.13.58** utilizando Docker e integrando com o LiteLLM (**http://10.121.243.101:8083/v1**).

---

## 1. Mapeamento de Parâmetros da Infraestrutura

- **Servidor da Aplicação**: `10.119.13.58`
- **Nome da Aplicação**: `AppEquipScanHub`
- **Servidor do Proxy LiteLLM**: `http://10.121.243.101:8083/v1`
- **Porta Padrão do Container**: `3000`

---

## 2. Verificar Disponibilidade da Porta 3000 no Servidor `10.119.13.58`

Conecte-se via SSH ao servidor `10.119.13.58` e execute os comandos abaixo para conferir se a porta **3000** está livre:

```bash
# Opção 1: Usando netstat
sudo netstat -tulpn | grep :3000

# Opção 2: Usando ss
sudo ss -tulpn | grep :3000

# Opção 3: Usando lsof
sudo lsof -i :3000

# Opção 4: Conferir se já existe um container Docker rodando na porta 3000
sudo docker ps --filter "publish=3000"
```

> **Aviso Importante**: Se a porta 3000 já estiver sendo utilizada por outro serviço no servidor `10.119.13.58`, edite o arquivo `docker-compose.yml` e altere a porta do host para outra porta livre, por exemplo: `"3001:3000"` ou `"8080:3000"`.

---

## 3. Configurar Arquivo `.env`

No diretório do projeto no servidor `10.119.13.58`, crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Conteúdo do arquivo `.env`:

```env
# Configuração do Proxy LiteLLM (Servidor 10.121.243.101)
LITELLM_BASE_URL="http://10.121.243.101:8083/v1"
LITELLM_API_KEY="COLOQUE_AQUI_SUA_CHAVE_LITELLM"
LITELLM_MODEL="gemini-3.6-flash"

# (Opcional) Chave Gemini direta para fallback
GEMINI_API_KEY=""

# Configurações do Servidor
PORT=3000
APP_URL="http://10.119.13.58:3000"
```

---

## 4. Testar Conectividade com o LiteLLM (10.121.243.101)

No servidor `10.119.13.58`, teste o acesso à API do LiteLLM antes de subir o container:

```bash
curl -i http://10.121.243.101:8083/v1/models \
  -H "Authorization: Bearer COLOQUE_AQUI_SUA_CHAVE_LITELLM"
```

---

## 5. Construção e Execução via Docker / Docker Compose

### Opção A: Usando Docker Compose (Recomendado)

```bash
# Construir a imagem e subir o container em background
docker compose up -d --build

# Acompanhar os logs do servidor
docker compose logs -f
```

### Opção B: Usando Docker CLI diretamente

```bash
# 1. Construir a imagem Docker
docker build -t app-equip-scan-hub .

# 2. Executar o container na porta 3000
docker run -d \
  --name app-equip-scan-hub \
  --restart always \
  -p 3000:3000 \
  --env-file .env \
  app-equip-scan-hub

# 3. Ver logs do container
docker logs -f app-equip-scan-hub
```

---

## 6. Validação do Deploy

Após subir o container, acesse o status de saúde da API e a aplicação no navegador:

- **Health Check API**: `http://10.119.13.58:3000/api/health`
- **Interface Web**: `http://10.119.13.58:3000`

---

## 7. Comandos de Manutenção Rápidos

```bash
# Reiniciar a aplicação
docker compose restart

# Parar o serviço
docker compose down

# Atualizar e re-compilar após alterações no código
git pull
docker compose up -d --build
```
