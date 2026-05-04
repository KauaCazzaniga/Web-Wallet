# models/

Responsabilidade: schemas Mongoose e modelos do MongoDB.

## Arquivos

### `User.js`
Campos: `name`, `email` (unique, lowercase), `password` (select: false).

Hook `pre('save')`: se `password` foi modificada, aplica `bcrypt.genSalt(10)` +
`bcrypt.hash`. Não usa `next()` — a função é async e o Mongoose detecta o fim.

### `Wallet.js`
Documento principal da aplicação. Um por `(usuario_id, competencia)`.

**Índice único:** `{ usuario_id: 1, competencia: 1 }` — violação retorna
erro `code 11000` tratado em `iniciarMes`.

Sub-schema `transacaoSchema`:
| Campo | Tipo | Obs |
|-------|------|-----|
| `data_hora` | Date | default: now |
| `tipo` | String | enum: receita / despesa |
| `categoria` | String | valor livre (regulares ou `gastos_fixos.*`) |
| `valor` | Number | obrigatório |
| `descricao` | String | obrigatório |
| `tags` | [String] | opcional |
| `importadoViaPdf` | Boolean | default: false |
| `deletadoEm` | Date | null = ativo; soft-delete |

Schema `walletSchema`:
| Campo | Tipo | Obs |
|-------|------|-----|
| `usuario_id` | ObjectId | ref: User |
| `competencia` | String | formato "YYYY-MM" |
| `resumo` | Object | saldo_inicial, total_receitas, total_despesas, saldo_atual |
| `transacoes` | [transacaoSchema] | embedded |
| `limites_gastos` | Map\<String, Number\> | categoria → limite em R$ |

### `Transaction.js`
Schema legado separado — **não usado diretamente** nas rotas atuais.
Transações são embedded em `Wallet.transacoes`. Não remover sem verificar
se há referências externas.

## Regras

- **Não alterar `transacaoSchema` sem migração** — documentos existentes no
  MongoDB não têm os campos novos e podem quebrar serialização.
- `limites_gastos` é um `Map` Mongoose — chamar sempre `normalizarLimites()`
  no controller antes de devolver ao cliente (converte para plain object).
- `password` tem `select: false` — para lê-la usar `.select('+password')` na
  query explicitamente.
- `deletadoEm: null` indica transação ativa. Filtrar sempre com
  `!transacao.deletadoEm` antes de exibir ou calcular.
