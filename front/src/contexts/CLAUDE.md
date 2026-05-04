# contexts/

Responsabilidade: contextos de infraestrutura da aplicação (auth e tema).
Diferente de `context/` (dados financeiros), aqui ficam os contextos transversais.

## Arquivos

### `AuthContext.jsx`

Provider: `AuthProvider` — deve envolver toda a aplicação em `App.jsx`.

Hook de acesso: `useAuth()`

| Export | Tipo | Descrição |
|--------|------|-----------|
| `user` | Object \| null | `{ _id, name, email }` |
| `authenticated` | boolean | true se há token válido |
| `loading` | boolean | true enquanto verifica token no mount |
| `login(email, password)` | async fn | POST /auth/login, salva token + user |
| `logout()` | fn | Limpa localStorage, zera estado |
| `register(name, email, password)` | async fn | POST /auth/register |

**Chaves do localStorage:**
- `@WebWallet:token` — JWT string
- `@WebWallet:user` — JSON do objeto user

### `ThemeContext.jsx`

Provider: `ThemeProvider`

Hook de acesso: `useTheme()`

| Export | Tipo | Descrição |
|--------|------|-----------|
| `isDark` | boolean | true = modo escuro |
| `toggleTheme()` | fn | Alterna e salva em localStorage |
| `theme` | Object | Tokens de cor (usado para passar ao AppContainer) |

**Chave do localStorage:** `@WebWallet:theme` (`"dark"` ou `"light"`)

## Regras

- Ordem dos providers em `App.jsx`: `ThemeProvider > AuthProvider > FinanceGate`.
- `loading` do AuthContext deve bloquear a renderização de rotas protegidas para
  evitar flash de redirect antes de verificar o token.
- Não usar `window.alert` para erros de autenticação — lançar o erro para o
  formulário tratar com mensagem inline.
