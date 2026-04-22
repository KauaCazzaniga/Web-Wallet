const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const connectDB = require('../config/database');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_chave_webwallet', {
        expiresIn: '1d',
    });
};

exports.register = async (req, res) => {
    try {
        await connectDB();
        const { name, email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({ error: 'Nome, e-mail e senha sao obrigatorios.' });
        }

        if (await User.findOne({ email: normalizedEmail })) {
            return res.status(400).json({ error: 'Usuario ja cadastrado.' });
        }

        const user = await User.create({ name, email: normalizedEmail, password });
        user.password = undefined;

        return res.status(201).json({
            user,
            token: generateToken(user._id),
        });
    } catch (err) {
        console.error('Erro no registro:', err);
        return res.status(400).json({ error: 'Falha no registro do usuario.' });
    }
};

exports.login = async (req, res) => {
    try {
        await connectDB();
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || !password) {
            return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });
        }

        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            return res.status(400).json({ error: 'Usuario nao encontrado.' });
        }

        if (!await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: 'Senha invalida.' });
        }

        user.password = undefined;

        return res.json({
            user,
            token: generateToken(user._id),
        });
    } catch (err) {
        console.error('Erro no login:', err);
        return res.status(400).json({ error: 'Erro ao realizar login.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        await connectDB();
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.json({ message: 'Se o e-mail existir, voce recebera um link em breve.' });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetPasswordToken = hash;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({
            to: user.email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'Web-Wallet - Redefinicao de senha',
            html: `
                <p>Ola, ${user.name}!</p>
                <p>Clique no link abaixo para redefinir sua senha. O link expira em <strong>15 minutos</strong>.</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p>Se voce nao solicitou a redefinicao, ignore este e-mail.</p>
            `,
        });

        return res.json({ message: 'Se o e-mail existir, voce recebera um link em breve.' });
    } catch (err) {
        console.error('Erro no forgotPassword:', err);
        return res.status(500).json({ error: 'Erro ao processar solicitacao.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        await connectDB();
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token e nova senha sao obrigatorios.' });
        }

        const hash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hash,
            resetPasswordExpires: { $gt: Date.now() },
        }).select('+resetPasswordToken +resetPasswordExpires');

        if (!user) {
            return res.status(400).json({ error: 'Token invalido ou expirado.' });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (err) {
        console.error('Erro no resetPassword:', err);
        return res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
};

exports.me = async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.usuarioId);

        if (!user) {
            return res.status(404).json({ error: 'Usuario nao encontrado.' });
        }

        return res.json({ user });
    } catch (err) {
        console.error('Erro no Me:', err);
        return res.status(500).json({ error: 'Erro ao buscar dados do usuario.' });
    }
};
