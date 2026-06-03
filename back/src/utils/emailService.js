const { Resend } = require('resend');
const { verificationEmail, passwordResetEmail } = require('./emailTemplates');

const FROM = process.env.FROM_EMAIL || 'noreply@waltrix.com.br';

// Construção lazy do cliente Resend — evita crash de "Missing API key" no import
// (ex.: em testes) e só exige a chave no primeiro envio real.
let resendClient;
function getResend() {
    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}

/**
 * Envia e-mail de verificação de conta com código de verificação.
 * @param {object} params
 * @param {string} params.to    — E-mail do destinatário
 * @param {string} params.name  — Nome do usuário
 * @param {string} params.code  — Código de verificação (6 dígitos)
 */
async function sendVerificationEmail({ to, name, code }) {
    const { error } = await getResend().emails.send({
        from: FROM,
        to,
        subject: 'Waltrix — Código de verificação de e-mail',
        html: verificationEmail({ name, code }),
    });

    if (error) {
        throw new Error(`Resend error (verification): ${error.message}`);
    }
}

/**
 * Envia e-mail de redefinição de senha com código de verificação.
 * @param {object} params
 * @param {string} params.to    — E-mail do destinatário
 * @param {string} params.name  — Nome do usuário
 * @param {string} params.code  — Código de verificação (6 dígitos)
 */
async function sendPasswordResetEmail({ to, name, code }) {
    const { error } = await getResend().emails.send({
        from: FROM,
        to,
        subject: 'Waltrix — Código de redefinição de senha',
        html: passwordResetEmail({ name, code }),
    });

    if (error) {
        throw new Error(`Resend error (reset): ${error.message}`);
    }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
