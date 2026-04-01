const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Função auxiliar para gerar o Token JWT
const gerarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d', // O token expira em 7 dias (o usuário precisará logar de novo depois disso)
    });
};

module.exports = {
    // -----------------------------------------------------------------
    // CADASTRO DE NOVO USUÁRIO
    // -----------------------------------------------------------------
    async registrar(req, res) {
        try {
            const { nome, email, senha } = req.body;

            // 1. Verifica se o e-mail já está cadastrado
            const usuarioExiste = await User.findOne({ email });
            if (usuarioExiste) {
                return res.status(400).json({ erro: 'Este e-mail já está em uso.' });
            }

            // 2. Criptografa a senha antes de salvar
            const salt = await bcrypt.genSalt(10);
            const senhaCriptografada = await bcrypt.hash(senha, salt);

            // 3. Cria o usuário no banco de dados
            const novoUsuario = await User.create({
                nome,
                email,
                senha: senhaCriptografada
            });

            // 4. Remove a senha do objeto de resposta por segurança
            novoUsuario.senha = undefined;

            // 5. Devolve os dados do usuário e já envia o token de login
            res.status(201).json({
                mensagem: 'Usuário cadastrado com sucesso!',
                usuario: novoUsuario,
                token: gerarToken(novoUsuario.id)
            });

        } catch (erro) {
            res.status(500).json({ erro: 'Erro no servidor.', detalhes: erro.message });
        }
    },

    // -----------------------------------------------------------------
    // LOGIN DE USUÁRIO EXISTENTE
    // -----------------------------------------------------------------
    async login(req, res) {
        try {
            const { email, senha } = req.body;

            // 1. Busca o usuário pelo e-mail (pedimos explicitamente para trazer a senha, pois no Model marcamos select: false)
            const usuario = await User.findOne({ email }).select('+senha');

            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }

            // 2. Compara a senha digitada com a senha criptografada do banco
            const senhaBate = await bcrypt.compare(senha, usuario.senha);

            if (!senhaBate) {
                return res.status(401).json({ erro: 'Senha inválida.' });
            }

            // 3. Remove a senha da resposta
            usuario.senha = undefined;

            // 4. Devolve o crachá de acesso (Token)
            res.status(200).json({
                mensagem: 'Login realizado com sucesso!',
                usuario,
                token: gerarToken(usuario.id)
            });

        } catch (erro) {
            res.status(500).json({ erro: 'Erro no servidor.', detalhes: erro.message });
        }
    }
};