# Web-Wallet

Aplicacao web para controle financeiro pessoal com frontend em React/Vite e backend em Node.js/Express com MongoDB.

## Visao geral

O projeto permite:

- cadastrar e autenticar usuarios;
- iniciar uma carteira mensal;
- registrar receitas e despesas por categoria;
- definir metas de gastos por categoria;
- acompanhar saldo, resumo mensal e transacoes recentes no dashboard.

## Estrutura do projeto

```text
Web-Wallet/
|- front/  -> aplicacao React com Vite
|- back/   -> API Node.js/Express
```

## Tecnologias

- React
- Vite
- styled-components
- Node.js
- Express
- MongoDB com Mongoose
- Axios

## Como executar

### Backend

```bash
cd back/src
npm install
node server.js
```

### Frontend

```bash
cd front
npm install
npm run dev
```

## Funcionalidades recentes

- edicao de metas por categoria diretamente no dashboard;
- barras de progresso sincronizadas com os gastos registrados;
- transacoes deletadas deixando de reaparecer em "Recent Transactions".

## Observacoes

- O frontend espera a API em `http://localhost:3000/api`.
- Existe uma pendencia de lint no frontend em arquivos fora deste ajuste (`AuthContext.jsx` e `Login.jsx`).
