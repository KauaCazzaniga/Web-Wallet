# controllers/

Responsabilidade: lógica de negócio das rotas — recebe `req`/`res`, chama
modelos, retorna JSON.

## Arquivos

### `authController.js`
- `register` — cria usuário (bcrypt na senha via pre-save do model User) + envia **código** de
  verificação por e-mail (não falha o cadastro se o e-mail não sair)
- `login` — valida credenciais e retorna JWT assinado com `JWT_SECRET`; **403** se `emailVerified` false
- `verifyEmail` — `{ email, code }`: confirma o e-mail por código (idempotente, limite de tentativas→429, `timingSafeEqual`)
- `resendVerification` — `{ email }` (rate-limit): regenera e reenvia o código; resposta genérica (anti-enumeration)
- `forgotPassword` — gera **código de 6 dígitos**, salva o hash sha256 + expiração (15 min),
  zera `resetPasswordAttempts` e envia o código por e-mail (Resend). Resposta sempre genérica
  (anti-enumeration).
- `resetPassword` — recebe `{ email, code, newPassword }`; valida código (não expirado, dentro
  de 5 tentativas → senão `429`), confere o hash com `crypto.timingSafeEqual`, troca a senha e
  limpa token/expiração/tentativas. E-mail e código nunca vivem no frontend.

> Dependências de I/O do authController (`connectDB`, `emailService`) são CommonJS — ver a nota
> de testes no `CLAUDE.md` raiz: `vi.mock` não intercepta `require()` aqui; use o curto-circuito
> de `global.mongoose.conn` e a ponte CJS `authController.testdeps.js`.

### `walletController.js`
Toda a lógica financeira. Funções internas (não exportadas):

| Função | Descrição |
|--------|-----------|
| `atualizarResumo(wallet)` | Recalcula receitas, despesas e saldo_atual |
| `normalizarLimites(limites)` | Converte Map/Mongoose Map para plain object |
| `competenciaEhValida(c)` | Regex `^\d{4}-\d{2}$` |
| `obterSnapshotResumo(wallet)` | Snapshot numérico do resumo |
| `resumoMudou(antes, depois)` | Compara dois snapshots |
| `serializarWallet(wallet)` | toObject + filtra soft-deleted + normaliza limites |
| `obterCompetenciaAnterior(c)` | Retorna mês anterior em "YYYY-MM" |
| `obterWalletAnteriorMaisRecente(uid, c)` | Query wallet mais recente antes de `c` |
| `montarWalletInicial(uid, c)` | Herda saldo_atual do mês anterior |
| `montarExtratoVirtual(uid, c)` | Extrato para meses sem wallet criada |
| `sincronizarCarteirasEmCadeia(uid)` | Propaga saldo entre meses em ordem |
| `obterOuCriarWallet(uid, c)` | findOne ou create |
| `adicionarTransacaoNaWallet(wallet, payload)` | Push e retorna a transação criada |

Métodos exportados (rotas):

| Método | Rota | Descrição |
|--------|------|-----------|
| `obterDashboard` | GET /dashboard | Resumo + últimas 5 transações + gastos por categoria |
| `iniciarMes` | POST /iniciar | Cria wallet para competência |
| `adicionarTransacao` | POST /transacao | Adiciona e sincroniza |
| `importarTransacoes` | POST /transacoes/importar | Bulk import (PDF) |
| `obterExtrato` | GET /extrato/:competencia | Retorna wallet ou extrato virtual |
| `deletarTransacao` | DELETE …/transacao/:id | Soft-delete individual |
| `deletarTodasTransacoes` | DELETE /:competencia/transacoes | Soft-delete em lote |
| `listarMeses` | GET /meses | Meses com transações ativas |
| `totalInvestido` | GET /total-investido?ate=YYYY-MM | Soma acumulada de investimentos até o mês |
| `definirLimites` | PUT /:competencia/limites | Salva limites_gastos na wallet |

## Regras

- **`sincronizarCarteirasEmCadeia` apenas em mutações, nunca em leituras.**
  Chamar após qualquer operação que altere saldo (add, delete, import, iniciarMes).
  `obterExtrato` **não chama** — os saldos já estão corretos porque toda mutação
  sincroniza a cadeia antes de retornar. Re-adicionar o sync em `obterExtrato` causaria
  full-scan do banco em toda troca de mês (regressão de performance intencional removida).
  `obterDashboard` ainda chama o sync como self-healing path para falhas parciais.
- **Falha parcial em mutação**: se `sincronizarCarteirasEmCadeia` falhar após `wallet.save()`,
  o chain fica temporariamente inconsistente. O próximo carregamento do Dashboard cura o chain
  via `obterDashboard`. O frontend invalida o cache após toda mutação, então o próximo fetch
  de qualquer mês virá direto do banco (sem servir dado stale).
- **Soft-delete obrigatório**: nunca remover transação do array — setar `deletadoEm`.
- **Competência**: validar com `competenciaEhValida` antes de qualquer operação.
- `totalInvestido` filtra `categoria === 'Investimentos'` **e** `tipo === 'despesa'`
  para evitar dupla contagem caso alguém registre receita com essa categoria.
- O parâmetro `ate` (query string) em `totalInvestido` é `$lte` na competência —
  permite calcular patrimônio acumulado até determinado mês.
