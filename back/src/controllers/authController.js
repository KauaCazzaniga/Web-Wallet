const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Função para gerar o Token JWT
// Mantendo a escala: o segredo vem do seu .env
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_chave_webwallet', {
        expiresIn: '1d',
    });
};

// --- REGISTRO (Cadastro) ---
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Verificação de infra: O e-mail já existe?
        if (await User.findOne({ email })) {
            return res.status(400).json({ error: 'Usuário já cadastrado.' });
        }

        // 2. Criação: O Model User.js cuidará do hash da senha automaticamente no pre-save
        const user = await User.create({ name, email, password });

        // 3. Segurança: Não devolvemos a senha no JSON
        user.password = undefined;

        // 4. Sucesso: Retorna o usuário criado e o Token
        return res.status(201).json({
            user,
            token: generateToken(user._id)
        });

    } catch (err) {
        console.error("Erro no registro:", err);
        return res.status(400).json({ error: 'Falha no registro do usuário.' });
    }
};

// --- LOGIN ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Busca o usuário incluindo a senha (select: false no model)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ error: 'Usuário não encontrado.' });
        }

        // 2. Comparação de senha com bcrypt
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: 'Senha inválida.' });
        }

        // 3. Limpa a senha da resposta
        user.password = undefined;

        // 4. Retorna dados + Token
        return res.json({
            user,
            token: generateToken(user._id)
        });

    } catch (err) {
        console.error("Erro no login:", err);
        return res.status(400).json({ error: 'Erro ao realizar login.' });
    }
};

// --- VERIFICAÇÃO DE SEGURANÇA (ME) ---
exports.me = async (req, res) => {
    try {
        // AJUSTE CRÍTICO: Usando 'usuarioId' para bater com o seu middleware
        // O seu middleware faz: req.usuarioId = decoded.id;
        const user = await User.findById(req.usuarioId);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Retorna o objeto user dentro de uma chave para facilitar no Front (Escala)
        return res.json({ user });
    } catch (err) {
        console.error("Erro no Me:", err);
        return res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
    }
};