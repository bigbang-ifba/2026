# ⚛️ Big Bang Game - Versão 2 (2026)

> Uma releitura moderna e interativa do clássico jogo educacional de química, reescrito do zero com tecnologias web atuais.

![Status](https://img.shields.io/badge/STATUS-CONCLUÍDO-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 📋 Sobre o Projeto

O **Big Bang Game v2** é a evolução tecnológica do projeto original de 2015. O objetivo educacional permanece o mesmo: auxiliar no ensino da Tabela Periódica, Distribuição Eletrônica e Propriedades dos Elementos através da gamificação.

No entanto, a arquitetura foi completamente transformada para atender aos padrões atuais de desenvolvimento de software, focando em performance, escalabilidade e manutenibilidade.

## ✨ O que há de novo na v2?

* 🚀 **Arquitetura Moderna:** Separação completa entre Front-end (React/Vite) e Back-end (Node/Express).
* 🛡️ **Segurança:** Autenticação JWT para áreas administrativas.
* ⚙️ **Painel Administrativo:** Interface para gerenciamento de elementos e perguntas sem mexer no código.
* 🎓 **Tutorial Interativo:** Guia passo-a-passo integrado (via Driver.js) para novos jogadores.
* ✅ **Qualidade de Código:** Cobertura de testes unitários no Front-end e Back-end.

## 🛠️ Tecnologias Utilizadas

### Front-end
* **React + Vite:** Performance e componentização.
* **TypeScript:** Tipagem estática para maior segurança.
* **CSS Modules:** Estilização modular e organizada.
* **Driver.js:** Para o sistema de tutorial guiado.

### Back-end
* **Node.js + Express:** API RESTful.
* **Prisma ORM:** Abstração e gerenciamento do banco de dados.
* **MySQL:** Banco de dados relacional.
* **Jest / Vitest:** Frameworks de testes unitários.

### Infraestrutura
* **Docker & Docker Compose:** Containerização de todo o ambiente para fácil deploy e execução.

## 🐳 Configuração Principal do Docker (.env na Raiz)

Para que o `docker-compose` suba os containers corretamente, é necessário configurar o arquivo de variáveis de ambiente na **raiz do projeto** (`.env`).

Este arquivo define a senha do banco de dados MySQL, a string de conexão para o banco que o Backend usará, o login e a senha de admin, as portas de conexão e a URL da API para o Frontend.

### Passo a Passo

1.  Na pasta raiz do projeto (onde está o `docker-compose.yml`), crie um arquivo chamado **`.env`** ou utilize o que está disponível neste repositório.
2.  Preencha com as configurações abaixo:

```ini
# --- Exemplo de configurações ---
# Define a senha do usuário 'root' do banco
MYSQL_ROOT_PASSWORD=senha

# Nome do banco de dados que será criado automaticamente
MYSQL_DATABASE=nomebanco

# --- Configurações do Backend ---
# A URL de conexão deve usar a senha e o banco definidos acima.
# Formato Docker: mysql://root:senha@db:3306/nome-banco
DATABASE_URL="mysql://root:senha@db:3306/nomebanco"

# Chave secreta para criptografia (JWT)
JWT_SECRET="coloque_chave_secreta"

# Porta do container do Node.js
PORT=3000

# Login do adminstrador do sistema
ADMIN_LOGIN="exemplo@admin.com"

# Senha do administrador do sistema
ADMIN_PASSWORD="exemplosenhaadmin"

# CORS
CORS_ORIGIN=http://localhost:5173

# --- Configurações do Frontend ---
# Endereço onde o React encontrará o Backend
VITE_API_URL=http://localhost:3000
```

## 📦 Como Rodar o Projeto

Este projeto utiliza Docker para garantir que funcione em qualquer máquina sem configurações complexas.

### Pré-requisitos
* [Docker](https://www.docker.com/) instalado e rodando.

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/bigbangifbav2/v2-big-bang.git](https://github.com/bigbangifbav2/v2-big-bang.git)
    cd v2-big-bang
    ```

2.  **Configure as variáveis de ambiente (Opcional):**
    O projeto já possui valores padrão no `docker-compose.yml`, mas para produção, crie arquivos `.env` baseados nos exemplos.

3.  **Suba a aplicação:**
    ```bash
    docker-compose up --build
    ```

4.  **Acesse:**
    * **Jogo (Front-end):** `http://localhost:5173`
    * **API (Back-end):** `http://localhost:3000`

## 🧪 Testes Automatizados

Para garantir a estabilidade do sistema, execute os testes unitários.

**Backend:**
```bash
cd backend
npm install
npm run test
```
**Frontend:**
```bash
cd frontend
npm install
npm run test
```
