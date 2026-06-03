# routes/

Responsabilidade: mapear URLs para controllers e encadear middlewares.

## Arquivos

### `authRoutes.js`
Rotas públicas (sem autenticação):
```
POST /api/auth/register             # cria conta + envia código de verificação por e-mail
POST /api/auth/login                # rate-limit: 10 / 15 min por IP
POST /api/auth/verify-email         # { email, code } — verifica e-mail por código
POST /api/auth/resend-verification  # rate-limit: 5 / 15 min por IP — reenvia código de verificação
POST /api/auth/forgot-password      # rate-limit: 5 / 15 min por IP — envia código de reset (6 dígitos)
POST /api/auth/reset-password       # { email, code, newPassword }
```
Rota protegida (via `authMiddleware`): `GET /api/auth/me`.

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
