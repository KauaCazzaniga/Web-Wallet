# middlewares/

Responsabilidade: interceptar requisições antes dos controllers para
autenticação e autorização.

## Arquivos

### `auth.js`
Extrai e valida o Bearer token JWT do header `Authorization`.
Em caso de sucesso injeta `req.usuarioId` (string ObjectId) e chama `next()`.
Em caso de falha responde `401`.

Deve ser o **primeiro middleware** em todas as rotas protegidas —
registrado globalmente em `walletRoutes.js` via `router.use(authMiddleware)`.

### `resourceOwnership.js`
Exporta `verifyTransactionOwnership`.

Verifica que a transação referenciada em `req.params.transacaoId` pertence ao
usuário autenticado. Faz uma query combinada:
```js
Wallet.findOne({ usuario_id, 'transacoes._id': transacaoId })
```
Em caso de sucesso anexa `req.wallet` ao request para o controller reutilizar
sem segundo round-trip ao banco. Em caso de falha responde `403`.

**Depende de `auth.js`** — `req.usuarioId` deve estar preenchido antes.
Usado apenas nas rotas de delete individual de transação.

## Regras

- **Nunca pular `auth.js`** em rotas que acessem dados do usuário.
- `verifyTransactionOwnership` deve vir **depois** de `authMiddleware` na cadeia,
  nunca antes.
- Novos middlewares de autorização (ex: ownership de outros recursos) devem
  seguir o mesmo padrão: query + inject no `req` + `next()`.
- Erros de middleware retornam sempre JSON `{ erro: "..." }`, nunca HTML.
