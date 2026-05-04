# routes/

Responsabilidade: mapear URLs para controllers e encadear middlewares.

## Arquivos

### `authRoutes.js`
Rotas públicas (sem autenticação):
```
POST /api/auth/register
POST /api/auth/login
```

### `walletRoutes.js`
Todas as rotas protegidas por `authMiddleware` (via `router.use`).
Prefixo montado em `server.js`: `/api/wallet`.

| Método | Caminho | Middleware extra | Controller |
|--------|---------|-----------------|-----------|
| GET | `/meses` | — | `listarMeses` |
| GET | `/total-investido` | — | `totalInvestido` |
| GET | `/dashboard` | — | `obterDashboard` |
| POST | `/iniciar` | — | `iniciarMes` |
| POST | `/transacao` | — | `adicionarTransacao` |
| POST | `/transacoes/importar` | — | `importarTransacoes` |
| GET | `/extrato/:competencia` | — | `obterExtrato` |
| DELETE | `/transacao/:transacaoId` | `verifyTransactionOwnership` | `deletarTransacao` |
| DELETE | `/:competencia/transacao/:transacaoId` | `verifyTransactionOwnership` | `deletarTransacao` |
| DELETE | `/:competencia/transacoes` | — | `deletarTodasTransacoes` |
| PUT | `/:competencia/limites` | — | `definirLimites` |

## Regras

- **Rotas estáticas antes de rotas com parâmetro** — `/meses` e `/total-investido`
  devem vir antes de `/:competencia/...` para não serem capturadas como parâmetro.
- Qualquer nova rota que acesse dados de uma transação específica deve passar
  por `verifyTransactionOwnership`.
- Não colocar lógica de negócio aqui — apenas mapeamento e middlewares.
