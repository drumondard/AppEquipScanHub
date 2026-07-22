# AppEquipScanHub | InventárIAr 📡🔍

> **Sistema de Validação e Identificação de Equipamentos de Infraestrutura e Telecomunicações com Visão Computacional (LiteLLM / Gemini AI)**

`AppEquipScanHub` é uma plataforma web full-stack desenvolvida para automação de inventário físico e auditoria de campo de equipamentos de redes, datacenter e telecomunicações (Switches, OLTs, Roteadores BGP, DIOs de fibra, Retificadores -48V, Patch Panels, Nobreaks e Gabinetes Outdoor).

---

## 🌟 Funcionalidades Principais

- **Identificação Automática por Visão Computacional**:
  - Integração nativa com **LiteLLM Proxy API** (`http://10.121.243.101:8083/v1`) e suporte a **Google Gemini 3.6 Flash**.
  - Detecção inteligente de marca/fabricante, modelo, categoria, nível de confiança e especificações visuais (portas RJ45, uplinks SFP+, fibra SC/APC, montagem em rack).

- **Validação Humana Lado a Lado (Human-in-the-Loop)**:
  - Comparação imediata entre a foto do equipamento e a sugestão técnica da IA.
  - Permite confirmar, corrigir ou rejeitar o diagnóstico antes de registrar no inventário.
  - **Operador Responsável Obrigatório**: Registro mandatório do nome do técnico ou engenheiro de campo para rastreabilidade e auditoria.

- **Ajuste Interativo de Bounding Box (Caixa Delimitadora IA)**:
  - Desenhe ou redimensione a área do equipamento diretamente na foto utilizando o mouse no inspetor visual.
  - Ajuste fino por coordenadas percentuais ($X/Y$).

- **Padronização Obrigatória de Lotes (`UF-LOC-EST`)**:
  - Estrutura de nomenclatura técnica obrigatória: `UF` (Estado) - `LOC` (Localidade/Cidade) - `EST` (Estação/POP/Rack).
  - Assistente para composição rápida dos códigos de estação (Ex: `SP-SPO-EST14`, `RJ-RJO-POP04`, `MG-BHZ-ERB02`).

- **Gestão e Limpeza de Lotes**:
  - Modal de gerenciamento completo com opções para esvaziar fotos mantendo o lote ativo, excluir lote completo ou restaurar demonstrações.
  - Upload múltiplo de fotos via drag-and-drop.

- **Exportação de Dados para Inventário**:
  - Relatórios técnicos em formato **JSON** e **CSV** para integração com sistemas ERP/CMDB de telecom.

---

## 🛠️ Arquitetura e Tecnologias

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React (Icons).
- **Backend**: Node.js, Express, esbuild (Bundle CJS em `dist/server.cjs`).
- **Provedor de IA**: LiteLLM OpenAI-Compatible Endpoint (`/v1/chat/completions`) com fallback para `@google/genai` (Gemini API).
- **Containerização**: Docker Multi-stage Build (`node:20-alpine`) & Docker Compose.

---

## 🚀 Como Executar em Desenvolvimento

### Pró-requisitos

- Node.js v20+
- npm v9+

### Passos:

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (.env)
cp .env.example .env

# 3. Iniciar o servidor em modo de desenvolvimento (Vite + Express on Port 3000)
npm run dev
```

Acesse em seu navegador: `http://localhost:3000`

---

## 🐳 Implantação em Produção com Docker

### Configuração do Arquivo `.env`

Crie o arquivo `.env` na raiz do projeto:

```env
# Proxy LiteLLM (Servidor 10.121.243.101)
LITELLM_BASE_URL="http://10.121.243.101:8083/v1"
LITELLM_API_KEY="sua-chave-litellm"
LITELLM_MODEL="gemini-3.6-flash"

# (Opcional) Chave Gemini Direta
GEMINI_API_KEY=""

# Configuração do Servidor
PORT=3000
APP_URL="http://10.119.13.58:3000"
```

### Executando com Docker Compose

```bash
# Compilar e subir o container em segundo plano
docker compose up -d --build

# Acompanhar logs em tempo real
docker compose logs -f
```

### Mapeamento de Portas e Proxy Corporativo

Se o seu ambiente corporativo utiliza servidor proxy HTTP e necessita de mapeamento em outra porta (como a porta `8080`), o `docker-compose.yml` já oferece suporte a `args` de proxy build:

```yaml
version: '3.8'

services:
  app-equip-scan-hub:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - HTTP_PROXY=http://10.130.12.13:82
        - HTTPS_PROXY=http://10.130.12.13:82
    container_name: app-equip-scan-hub
    restart: always
    ports:
      - "8080:3000"
    env_file:
      - .env
```

---

## 📊 Endpoints de API

- `GET /api/health` - Verifica o status operacional do servidor.
- `POST /api/identify-equipment` - Processa imagem em base64 e envia ao LiteLLM/Gemini para identificação com visão computacional.

---

## 🔒 Licença e Segurança

- As chaves de API nunca são expostas no cliente (browser). Todas as requisições passam pela rota `/api/*` do servidor Express.
- Desenvolvido para operadoras, provedores de internet (ISPs) e equipes de engenharia de campo.
