const { Resend } = require('resend');
const { verificationEmail, passwordResetEmail } = require('./emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.FROM_EMAIL || 'noreply@waltrix.com.br';

/**
 * Envia e-mail de verificação de conta.
 * @param {object} params
 * @param {string} params.to        — E-mail do destinatário
 * @param {string} params.name      — Nome do usuário
 * @param {string} params.verifyUrl — URL de verificação
 */
async function sendVerificationEmail({ to, name, verifyUrl }) {
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: 'Waltrix — Confirme seu e-mail',
        html: verificationEmail({ name, verifyUrl }),
    });

    if (error) {
        throw new Error(`Resend error (verification): ${error.message}`);
    }
}

/**
 * Envia e-mail de redefinição de senha.
 * @param {object} params
 * @param {string} params.to       — E-mail do destinatário
 * @param {string} params.name     — Nome do usuário
 * @param {string} params.resetUrl — URL de reset
 */
async function sendPasswordResetEmail({ to, name, resetUrl }) {
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: 'Waltrix — Redefinição de senha',
        html: passwordResetEmail({ name, resetUrl }),
    });

    if (error) {
        throw new Error(`Resend error (reset): ${error.message}`);
    }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
