const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Pega o crachá que vem no cabeçalho da requisição
    const authHeader = req.headers.authorization;

    // Se não mandou o crachá, é barrado na hora
    if (!authHeader) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    // O padrão da web é enviar o token assim: "Bearer dhi21y8d8y21d..."
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ erro: 'Erro no formato do Token.' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ erro: 'Token mal formatado.' });
    }

    // 2. Verifica se o crachá é verdadeiro e se foi assinado com a NOSSA chave secreta
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ erro: 'Token inválido ou expirado.' });
        }

        // 3. Se o crachá é válido, pegamos o ID do usuário que estava escondido lá dentro
        // e anexamos na requisição. Assim, os próximos passos sabem exatamente de quem é o dinheiro.
        req.usuarioId = decoded.id;

        // Deixa o usuário passar!
        return next();
    });
};