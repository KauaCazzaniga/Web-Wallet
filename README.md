# Web-Wallet API 💰

Uma API backend desenvolvida em **Node.js**, **Express** e **MongoDB** (Mongoose) para gerenciamento financeiro pessoal. O sistema permite criar uma conta, gerenciar carteiras mensais (com transferência de saldo entre meses), registrar receitas e despesas, além de definir limites de gastos por categoria.

## 🚀 Tecnologias Utilizadas

- **Node.js** & **Express** - Criação da API e rotas
- **MongoDB** & **Mongoose** - Banco de dados NoSQL e modelagem de dados
- **JWT (JSON Web Token)** - Autenticação e segurança das rotas
- **Bcrypt.js** - Criptografia de senhas
- **Dotenv** - Gerenciamento de variáveis de ambiente

## 📦 Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/KauaCazzaniga/Web-Wallet.git
   cd Web-Wallet
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```env
   PORT=3000
   MONGO_URI=sua_string_de_conexao_mongodb
   JWT_SECRET=sua_chave_secreta_jwt
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   # ou usando node diretamente:
   node src/server.js
   ```

O servidor iniciará na porta especificada (padrão: 3000).

## 🔀 Rotas da API

### 🔐 Autenticação (`/api/auth`)
- `POST /registrar`: Cria um novo usuário (criptografa a senha).
- `POST /login`: Autentica o usuário e retorna um token JWT.

### 💳 Carteira e Transações (`/api/wallet`) - *Requer Token JWT*
*Todas as rotas de carteira precisam do header `Authorization: Bearer <token>`*.

- `POST /iniciar`: Inicia uma nova competência/mês (ex: `{"competencia": "2026-05"}`). Transfere automaticamente o saldo atual do mês anterior como saldo inicial do novo mês.
- `POST /transacao`: Registra uma nova transação (receita ou despesa). O saldo é recalculado automaticamente.
- `GET /extrato/:competencia`: Retorna o extrato completo do mês, incluindo transações, resumo de caixa, gastos por categoria e limites.
- `DELETE /:competencia/transacao/:transacaoId`: Deleta uma transação específica via *Soft Delete* (não apaga do banco, mas marca como deletada) e recalcula o caixa.
- `PUT /:competencia/limites`: Define ou atualiza os limites de gastos por categoria para o mês.

## 🧠 Lógicas de Negócio e Funcionalidades

- **Transferência de Saldo Inteligente**: Ao iniciar um mês novo, a API busca automaticamente os dados do mês anterior e aplica o "saldo atual" como "saldo inicial" do novo mês.
- **Soft Delete em Transações**: Transações excluídas não somem do banco. Elas recebem um registro temporal `deletadoEm`, permitindo restaurá-las (ou manter histórico de auditoria) enquanto o saldo é ajustado.
- **Agrupamento de Gastos**: O extrato retorna não apenas a lista de transações ativas, mas um mapa contendo o total gasto por categoria (ex: Alimentação: R$ 500, Lazer: R$ 200) para facilitar a criação de gráficos no Frontend.
- **Proteção por Usuário**: O middleware JWT identifica o dono do Token, impedindo que "João" consiga ler ou modificar os dados financeiros de "Maria".
