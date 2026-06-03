const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const connectDB = require('../config/database');
const emailService = require('../utils/emailService');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Máximo de tentativas de código (reset de senha e verificação de e-mail) antes de exigir novo envio
const MAX_CODE_ATTEMPTS = 5;

// Validade dos códigos
const RESET_CODE_TTL_MS = 15 * 60 * 1000;       // 15 min — reset de senha
const VERIFY_CODE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h — verificação de e-mail no cadastro

// Gera um código numérico de 6 dígitos (000000–999999) para verificação/reset
const gerarCodigoVerificacao = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const hashCodigo = (codigo) => crypto.createHash('sha256').update(String(codigo)).digest('hex');

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado. Defina a variável de ambiente antes de iniciar o servidor.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.register = async (req, res) => {
    try {
        await connectDB();
        const { name, email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({ error: 'Nome, e-mail e senha sao obrigatorios.' });
        }

        const existente = await User.findOne({ email: normalizedEmail });
        if (existente) {
            // Conta já verificada → não dá para recadastrar; peça login.
            if (existente.emailVerified) {
                return res.status(400).json({ error: 'Usuario ja cadastrado.' });
            }
            // Conta existe mas nunca foi verificada → reenvia o código e leva à verificação,
            // em vez de um beco sem saída. (emailVerified não é select:false, leitura é direta.)
            const codigoReenvio = gerarCodigoVerificacao();
            existente.emailVerificationToken = hashCodigo(codigoReenvio);
            existente.emailVerificationExpires = new Date(Date.now() + VERIFY_CODE_TTL_MS);
            existente.emailVerificationAttempts = 0;
            await existente.save({ validateBeforeSave: false });

            try {
                await emailService.sendVerificationEmail({ to: existente.email, name: existente.name, code: codigoReenvio });
            } catch (emailErr) {
                console.error('Falha ao reenviar e-mail de verificação:', emailErr.message);
            }

            return res.status(200).json({
                needsVerification: true,
                email: existente.email,
                message: 'Esta conta já existe mas não foi verificada. Enviamos um novo código para o seu e-mail.',
            });
        }

        const codigo = gerarCodigoVerificacao();

        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            emailVerified: false,
            emailVerificationToken: hashCodigo(codigo),
            emailVerificationExpires: new Date(Date.now() + VERIFY_CODE_TTL_MS),
            emailVerificationAttempts: 0,
        });

        // O cadastro não falha se o e-mail não sair — o usuário pode usar "reenviar código"
        // na tela de verificação. Apenas registramos a falha.
        try {
            await emailService.sendVerificationEmail({ to: user.email, name: user.name, code: codigo });
        } catch (emailErr) {
            console.error('Falha ao enviar e-mail de verificação:', emailErr.message);
        }

        user.password = undefined;

        return res.status(201).json({
            user,
            message: 'Conta criada! Enviamos um código de verificação para o seu e-mail.',
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

        if (!user.emailVerified) {
            return res.status(403).json({ error: 'E-mail nao verificado. Confira sua caixa de entrada.' });
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

exports.verifyEmail = async (req, res) => {
    try {
        await connectDB();
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'E-mail e codigo sao obrigatorios.' });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail })
            .select('+emailVerificationToken +emailVerificationExpires +emailVerificationAttempts');

        if (!user) {
            return res.status(400).json({ error: 'Codigo invalido ou expirado.' });
        }

        // Já verificado → idempotente, responde sucesso sem erro
        if (user.emailVerified) {
            return res.json({ message: 'E-mail ja verificado. Voce ja pode fazer login.' });
        }

        if (!user.emailVerificationToken || !user.emailVerificationExpires) {
            return res.status(400).json({ error: 'Codigo invalido ou expirado.' });
        }

        // Expirado → limpa o código e pede um novo
        if (user.emailVerificationExpires.getTime() < Date.now()) {
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            user.emailVerificationAttempts = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ error: 'Codigo invalido ou expirado.' });
        }

        // Excedeu o limite de tentativas → exige novo envio
        if ((user.emailVerificationAttempts || 0) >= MAX_CODE_ATTEMPTS) {
            return res.status(429).json({ error: 'Muitas tentativas. Solicite um novo codigo.' });
        }

        // Comparação em tempo constante (hashes de tamanho fixo)
        const fornecido = Buffer.from(hashCodigo(code), 'hex');
        const armazenado = Buffer.from(user.emailVerificationToken, 'hex');
        const confere = fornecido.length === armazenado.length
            && crypto.timingSafeEqual(fornecido, armazenado);

        if (!confere) {
            user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ error: 'Codigo invalido ou expirado.' });
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.emailVerificationAttempts = undefined;
        await user.save({ validateBeforeSave: false });

        return res.json({ message: 'E-mail verificado com sucesso! Voce ja pode fazer login.' });
    } catch (err) {
        console.error('Erro no verifyEmail:', err);
        return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        await connectDB();
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        // Resposta genérica (anti-enumeration): não revela se o e-mail existe nem se já foi verificado
        const respostaGenerica = { message: 'Se o e-mail existir e ainda nao tiver sido verificado, enviaremos um novo codigo.' };

        if (!user || user.emailVerified) {
            return res.json(respostaGenerica);
        }

        const codigo = gerarCodigoVerificacao();

        user.emailVerificationToken = hashCodigo(codigo);
        user.emailVerificationExpires = new Date(Date.now() + VERIFY_CODE_TTL_MS);
        user.emailVerificationAttempts = 0;
        await user.save({ validateBeforeSave: false });

        await emailService.sendVerificationEmail({ to: user.email, name: user.name, code: codigo });

        return res.json(respostaGenerica);
    } catch (err) {
        console.error('Erro no resendVerification:', err);
        return res.status(500).json({ error: 'Erro ao reenviar codigo.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        await connectDB();
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        // Resposta genérica (anti-enumeration): não revelar se o e-mail existe
        const respostaGenerica = { message: 'Se o e-mail existir, voce recebera um codigo em breve.' };

        if (!user) {
            return res.json(respostaGenerica);
        }

        const codigo = gerarCodigoVerificacao();

        user.resetPasswordToken = hashCodigo(codigo);
        user.resetPasswordExpires = new Date(Date.now() + RESET_CODE_TTL_MS);
        user.resetPasswordAttempts = 0;
        await user.save({ validateBeforeSave: false });

        await emailService.sendPasswordResetEmail({ to: user.email, name: user.name, code: codigo });

        return res.json(respostaGenerica);
    } catch (err) {
        console.error('Erro no forgotPassword:', err);
        return res.status(500).json({ error: 'Erro ao processar solicitacao.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        await connectDB();
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: 'E-mail, codigo e nova senha sao obrigatorios.' });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail })
            .select('+resetPasswordToken +resetPasswordExpires +resetPasswordAttempts');

        // Código inexistente ou já consumido → mensagem genérica de inválido/expirado
        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
            return res.status(400).json({ error: 'Codigo invalido ou expirado.' });
        }

        // Expirado → limpa o código e pede um novo
        if (user.resetPasswordExpires.getTime() < Date.now()) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.resetPasswordAttempts = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ error: 'Codigo invalido ou expirado.' });
        }

        // Excedeu o limite de tentativas → exige novo envio
        if ((user.resetPasswordAttempts || 0) >= MAX_CODE_ATTEMPTS) {
            return res.status(429).json({ error: 'Muitas tentativas. Solicite um novo codigo.' });
        }

        // Comparação em tempo constante (hashes de tamanho fixo)
        const fornecido = Buffer.from(hashCodigo(code), 'hex');
        const armazenado = Buffer.from(user.resetPasswordToken, 'hex');
        const confere = fornecido.length === armazenado.length
            && crypto.timingSafeEqual(fornecido, armazenado);

        if (!confere) {
            user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ error: 'Codigo invalido ou expirado.' });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.resetPasswordAttempts = undefined;
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
