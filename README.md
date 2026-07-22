# AppEquipScan-Reviewer

Um painel interativo desenvolvido em **Streamlit** e integrado com **Google AI Studio / Modelos de Visão** para navegação, validação e correção humana de identificações de imagens de equipamentos de infraestrutura e telecomunicações.

---

## 🚀 Funcionalidades

- **Seleção Dinâmica de Repositório:** Aponte para qualquer diretório local contendo imagens (`.png`, `.jpg`, `.jpeg`, `.jfif`).
- **Navegação Fluida:** Interface intuitiva com controles de avanço e retrocesso entre as imagens do repositório.
- **Validação Cruzada (IA + Humano):** 
  - Visualização lado a lado da imagem e da sugestão de identificação gerada por IA.
  - Campos editáveis para confirmar ou corrigir o nome do equipamento.
  - Atualização de status da revisão (`Pendente`, `Confirmado`, `Corrigido`).
- **Relatório de Sessão:** Painel expansível com o resumo consolidado de todas as validações realizadas na sessão.

---

## 🛠️ Tecnologias Utilizadas

- **Python 3.10+**
- **Streamlit** (para a interface web interativa)
- **Pillow (PIL)** (para processamento e manipulação de imagens)
- **Google AI Studio / Gemini Vision API** (para inferência e identificação automatizada de equipamentos)

---

## 📦 Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/AppEquipScan-Reviewer.git
   cd AppEquipScan-Reviewer
   ```

2. **Crie e ative um ambiente virtual (recomendado):**
   ```bash
   python -m venv venv
   # No Windows:
   venv\Scripts\activate
   # No Linux/Mac:
   source venv/bin/activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Execute o aplicativo Streamlit:**
   ```bash
   streamlit run app.py
   ```

---

## 💡 Como Usar

1. Na barra lateral, insira o caminho completo ou relativo da pasta que contém as imagens de infraestrutura que deseja analisar.
2. Navegue entre as imagens usando os botões **Anterior** e **Próxima**.
3. Analise a sugestão automática fornecida pela inteligência artificial.
4. Se necessário, ajuste o nome do equipamento no campo de texto, altere o status de revisão e clique em **Salvar Alteração**.
