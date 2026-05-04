# controllers/

Responsabilidade: lógica de negócio das rotas — recebe `req`/`res`, chama
modelos, retorna JSON.

## Arquivos

### `authController.js`
- `register` — cria usuário (bcrypt na senha via pre-save do model User)
- `login` — valida credenciais e retorna JWT assinado com `JWT_SECRET`

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

- **Sempre chamar `sincronizarCarteirasEmCadeia`** após qualquer mutação que afete
  saldo (add, delete, import). Sem ela, os meses seguintes ficam com saldo_inicial
  desatualizado.
- **Soft-delete obrigatório**: nunca remover transação do array — setar `deletadoEm`.
- **Competência**: validar com `competenciaEhValida` antes de qualquer operação.
- `totalInvestido` filtra `categoria === 'Investimentos'` **e** `tipo === 'despesa'`
  para evitar dupla contagem caso alguém registre receita com essa categoria.
- O parâmetro `ate` (query string) em `totalInvestido` é `$lte` na competência —
  permite calcular patrimônio acumulado até determinado mês.
