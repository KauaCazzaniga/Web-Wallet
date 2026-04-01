const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Tenta fazer a conexão usando a variável de ambiente do seu .env
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(` MongoDB Conectado com sucesso: ${conn.connection.host}`);
    } catch (error) {
        console.error(` Erro crítico ao conectar no MongoDB: ${error.message}`);

        // O process.exit(1) força o servidor Node.js a parar completamente 
        // se o banco de dados falhar, evitando que a API rode com erros.
        process.exit(1);
    }
};

module.exports = connectDB;