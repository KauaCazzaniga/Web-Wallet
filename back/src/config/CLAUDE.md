# config/

Responsabilidade: inicialização e conexão com serviços externos.

## Arquivos

### `database.js`
Exporta `connectDB()` — função async que conecta o Mongoose ao MongoDB usando
`process.env.MONGODB_URI`. Em caso de falha crítica chama `process.exit(1)` para
evitar que a API suba sem banco.

Chamada em `server.js` antes de qualquer rota ser registrada.

## Regras

- **Não adicionar lógica de negócio aqui** — apenas conexão/configuração de infra.
- Se precisar de um segundo serviço externo (Redis, S3, etc.), criar um arquivo
  separado (`redis.js`, `storage.js`) seguindo o mesmo padrão de exportar uma
  função `connect*` e tratar falha com `process.exit(1)`.
- Variáveis de ambiente obrigatórias para este módulo: `MONGODB_URI`.
