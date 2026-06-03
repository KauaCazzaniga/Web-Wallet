/**
 * Templates HTML de e-mail para o Waltrix — identidade visual "Charged Quiet".
 *
 * Compatível com a maioria dos clientes de e-mail: layout em <table>, estilos inline,
 * sem CSS externo, sem SVG inline (clientes removem). O raio da marca é servido como PNG
 * hospedado (`EMAIL_LOGO_URL`). Efeitos não suportados por alguns clientes (box-shadow,
 * text-shadow, gradient) degradam graciosamente sobre cores sólidas de fallback.
 */

// Paleta da marca (raio violeta → ciano sobre fundo "vault")
const C = {
    void: '#05070f',       // fundo externo profundo
    card: '#0b0f1c',       // slab do cartão
    cardTop: '#0e1426',    // topo do gradiente do cartão
    border: '#1e2740',
    codeBg: '#070a14',
    codeBorder: '#1d2640',
    violet: '#7e14ff',
    violetSoft: '#9b51ff',
    cyan: '#47bfff',
    white: '#ffffff',
    heading: '#ffffff',
    text: '#9aa6c4',
    strong: '#e6ebf7',
    muted: '#5f6a87',
    micro: '#5b6685',
    footer: '#454f6e',
    hair: '#161d33',
    chipText: '#86b9e8',
};

const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, 'Courier New', monospace";

// Logo do raio (PNG transparente em front/public/email-logo.png). Override via env.
const LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://www.waltrix.com.br/email-logo.png';

/**
 * Layout base compartilhado por todos os templates.
 * @param {object} params
 * @param {string} params.content   — HTML interno do corpo do cartão
 * @param {string} params.ref       — marcador de referência discreto no cabeçalho (ex.: "VFY · 001")
 * @param {string} params.preheader — texto de pré-visualização (oculto) exibido na caixa de entrada
 * @returns {string} HTML completo do e-mail
 */
function baseLayout({ content, ref = '', preheader = '' }) {
    const ano = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <title>Waltrix</title>
</head>
<body style="margin:0;padding:0;background-color:${C.void};">
  <!-- Texto de pré-visualização (oculto) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.void};font-size:1px;line-height:1px;">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         bgcolor="${C.void}" style="background-color:${C.void};font-family:${FONT};">
    <tr><td align="center" style="padding:44px 16px;">

      <!-- Cartão -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
             style="width:560px;max-width:560px;background-color:${C.card};
                    background-image:linear-gradient(180deg,${C.cardTop} 0%,${C.card} 100%);
                    border:1px solid ${C.border};border-radius:22px;overflow:hidden;">

        <!-- Cabeçalho: raio + wordmark + referência -->
        <tr><td style="padding:36px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;width:50px;">
              <img src="${LOGO_URL}" width="46" height="45" alt="Waltrix"
                   style="display:block;width:46px;height:45px;border:0;outline:none;text-decoration:none;" />
            </td>
            <td style="vertical-align:middle;padding-left:13px;">
              <div style="font-family:${FONT};font-weight:700;font-size:23px;letter-spacing:-0.6px;color:${C.white};line-height:1;">Waltrix</div>
              <div style="font-family:${FONT};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.micro};padding-top:5px;">Controle&nbsp;Financeiro</div>
            </td>
            <td style="vertical-align:middle;text-align:right;font-family:${MONO};font-size:10px;letter-spacing:1px;color:#3f4a68;">${ref}</td>
          </tr></table>
        </td></tr>

        <!-- Fio carregado (gradiente com fallback sólido) -->
        <tr><td style="padding:28px 40px 0 40px;">
          <div style="height:2px;line-height:2px;font-size:0;border-radius:2px;
                      background-color:${C.violet};
                      background-image:linear-gradient(90deg,${C.violet} 0%,${C.violetSoft} 38%,${C.cyan} 100%);">&nbsp;</div>
        </td></tr>

        <!-- Conteúdo -->
        <tr><td style="padding:32px 40px 0 40px;">
          ${content}
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="padding:30px 40px 34px 40px;">
          <div style="height:1px;background-color:${C.hair};margin-bottom:20px;font-size:0;line-height:1px;">&nbsp;</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-family:${FONT};font-size:11px;color:${C.footer};line-height:1.7;">
              © ${ano} Waltrix · waltrix.com.br<br/>
              E-mail automático — por favor, não responda.
            </td>
            <td style="text-align:right;font-family:${FONT};font-size:11px;letter-spacing:.3px;">
              <a href="https://www.waltrix.com.br" style="color:#7e8bb0;text-decoration:none;">Ajuda</a>
              <span style="color:#2a3350;">&nbsp;·&nbsp;</span>
              <a href="https://www.waltrix.com.br" style="color:#7e8bb0;text-decoration:none;">Privacidade</a>
            </td>
          </tr></table>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Bloco do código de verificação — monumento da composição (dígitos grandes em mono).
 * @param {string} code  — código numérico (6 dígitos)
 * @returns {string} HTML do módulo de código
 */
function codeBlock(code) {
    // Espaço fino no meio para legibilidade (ex.: "284 913")
    const display = String(code).length === 6
        ? `${String(code).slice(0, 3)} ${String(code).slice(3)}`
        : code;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background-color:${C.codeBg};border:1px solid ${C.codeBorder};border-radius:16px;">
        <tr><td style="padding:26px 20px;text-align:center;">
          <div style="font-family:${MONO};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.micro};padding-bottom:16px;">
            ⚡&nbsp; Código de verificação
          </div>
          <div style="font-family:${MONO};font-weight:700;font-size:40px;letter-spacing:12px;color:${C.white};padding-left:12px;">${display}</div>
        </td></tr>
      </table>`;
}

/**
 * Pílula de expiração (chip ciano translúcido).
 * @param {string} prazo — texto do prazo (ex.: "24 horas")
 * @returns {string} HTML do chip
 */
function expiryChip(prazo) {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background-color:#0c1826;border:1px solid #1d3a52;border-radius:999px;padding:8px 16px;font-family:${FONT};font-size:12.5px;color:${C.chipText};">
          ⏳&nbsp; Expira em <span style="color:#cfe4f8;font-weight:600;">${prazo}</span>
        </td>
      </tr></table>`;
}

/**
 * Template de verificação de e-mail (enviado no registro) — exibe um código numérico.
 * @param {object} params
 * @param {string} params.name   — Nome do usuário
 * @param {string} params.code   — Código de verificação (6 dígitos)
 * @returns {string} HTML completo do e-mail
 */
function verificationEmail({ name, code }) {
    const content = `
      <div style="font-family:${FONT};font-weight:700;font-size:23px;color:${C.heading};letter-spacing:-0.4px;line-height:1.25;">
        Confirme seu acesso
      </div>
      <div style="font-family:${FONT};font-size:15px;color:${C.text};line-height:1.65;padding-top:12px;">
        Olá, <span style="color:${C.strong};font-weight:600;">${name}</span>. Sua conta está quase pronta.
        Use o código abaixo para confirmar seu e-mail e ativar o Waltrix.
      </div>
      <div style="padding-top:26px;">${codeBlock(code)}</div>
      <div style="padding-top:22px;">${expiryChip('24 horas')}</div>
      <div style="font-family:${FONT};font-size:12.5px;color:${C.muted};line-height:1.6;padding-top:20px;">
        Se você não criou esta conta, ignore este e-mail com segurança — nenhuma ação é necessária.
      </div>`;
    return baseLayout({
        content,
        ref: 'VFY · 001',
        preheader: `Seu código de verificação Waltrix é ${code}`,
    });
}

/**
 * Template de redefinição de senha — exibe um código de verificação numérico.
 * @param {object} params
 * @param {string} params.name   — Nome do usuário
 * @param {string} params.code   — Código de verificação (6 dígitos)
 * @returns {string} HTML completo do e-mail
 */
function passwordResetEmail({ name, code }) {
    const content = `
      <div style="font-family:${FONT};font-weight:700;font-size:23px;color:${C.heading};letter-spacing:-0.4px;line-height:1.25;">
        Redefinição de senha
      </div>
      <div style="font-family:${FONT};font-size:15px;color:${C.text};line-height:1.65;padding-top:12px;">
        Olá, <span style="color:${C.strong};font-weight:600;">${name}</span>. Recebemos uma solicitação
        para redefinir a senha da sua conta. Use o código abaixo para criar uma nova senha.
      </div>
      <div style="padding-top:26px;">${codeBlock(code)}</div>
      <div style="padding-top:22px;">${expiryChip('15 minutos')}</div>
      <div style="font-family:${FONT};font-size:12.5px;color:${C.muted};line-height:1.6;padding-top:20px;">
        Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
      </div>`;
    return baseLayout({
        content,
        ref: 'PWD · 002',
        preheader: `Seu código de redefinição de senha Waltrix é ${code}`,
    });
}

module.exports = { verificationEmail, passwordResetEmail };
