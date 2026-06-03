/**
 * Templates HTML de e-mail para o Waltrix.
 * Compatível com a maioria dos clientes de e-mail (inline styles, sem CSS externo).
 */

const BASE_STYLE = {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    bg: '#0f172a',        // slate-900
    card: '#1e293b',      // slate-800
    border: '#334155',    // slate-700
    accent: '#6366f1',    // indigo-500
    accentHover: '#4f46e5',
    text: '#e2e8f0',      // slate-200
    muted: '#94a3b8',     // slate-400
    white: '#ffffff',
};

/**
 * Layout base compartilhado por todos os templates.
 * @param {string} content — HTML interno do card
 */
function baseLayout(content) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Waltrix</title>
</head>
<body style="margin:0;padding:0;background-color:${BASE_STYLE.bg};font-family:${BASE_STYLE.fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BASE_STYLE.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background-color:${BASE_STYLE.card};border:1px solid ${BASE_STYLE.border};border-radius:12px;overflow:hidden;">

          <!-- Cabeçalho -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid ${BASE_STYLE.border};">
              <span style="font-size:22px;font-weight:700;color:${BASE_STYLE.white};letter-spacing:-0.5px;">
                💼 Waltrix
              </span>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid ${BASE_STYLE.border};">
              <p style="margin:0;font-size:12px;color:${BASE_STYLE.muted};line-height:1.6;">
                Este e-mail foi enviado automaticamente. Por favor, não responda.<br/>
                © ${new Date().getFullYear()} Waltrix · waltrix.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Template de verificação de e-mail (enviado no registro) — exibe um código numérico.
 * @param {object} params
 * @param {string} params.name   — Nome do usuário
 * @param {string} params.code   — Código de verificação (6 dígitos)
 */
function verificationEmail({ name, code }) {
    const content = `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BASE_STYLE.white};">
        Bem-vindo, ${name}! 👋
      </h2>
      <p style="margin:0 0 24px;font-size:15px;color:${BASE_STYLE.muted};line-height:1.6;">
        Sua conta foi criada com sucesso. Use o código de verificação abaixo para confirmar seu e-mail e ativar sua conta.
      </p>

      <!-- Código de verificação -->
      <div style="margin:0 0 28px;padding:24px;background-color:${BASE_STYLE.bg};border:1px solid ${BASE_STYLE.border};border-radius:12px;text-align:center;">
        <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${BASE_STYLE.muted};">
          Seu código de verificação
        </p>
        <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:10px;color:${BASE_STYLE.white};font-family:'Courier New',monospace;">
          ${code}
        </span>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:${BASE_STYLE.muted};line-height:1.6;">
        O código expira em <strong style="color:${BASE_STYLE.text};">24 horas</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:${BASE_STYLE.muted};line-height:1.6;">
        Se você não criou esta conta, ignore este e-mail com segurança.
      </p>
    `;
    return baseLayout(content);
}

/**
 * Template de redefinição de senha — exibe um código de verificação numérico.
 * @param {object} params
 * @param {string} params.name   — Nome do usuário
 * @param {string} params.code   — Código de verificação (6 dígitos)
 */
function passwordResetEmail({ name, code }) {
    const content = `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BASE_STYLE.white};">
        Redefinição de senha 🔑
      </h2>
      <p style="margin:0 0 24px;font-size:15px;color:${BASE_STYLE.muted};line-height:1.6;">
        Olá, <strong style="color:${BASE_STYLE.text};">${name}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta Waltrix.
        Use o código de verificação abaixo para criar uma nova senha.
      </p>

      <!-- Código de verificação -->
      <div style="margin:0 0 28px;padding:24px;background-color:${BASE_STYLE.bg};border:1px solid ${BASE_STYLE.border};border-radius:12px;text-align:center;">
        <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${BASE_STYLE.muted};">
          Seu código de verificação
        </p>
        <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:10px;color:${BASE_STYLE.white};font-family:'Courier New',monospace;">
          ${code}
        </span>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:${BASE_STYLE.muted};line-height:1.6;">
        O código expira em <strong style="color:${BASE_STYLE.text};">15 minutos</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:${BASE_STYLE.muted};line-height:1.6;">
        Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
      </p>
    `;
    return baseLayout(content);
}

module.exports = { verificationEmail, passwordResetEmail };
