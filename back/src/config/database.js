const mongoose = require('mongoose');

// Cache da conexão para reutilizar entre invocações serverless (Vercel)
// Sem isso, cada request abriria uma nova conexão com o MongoDB Atlas
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // Se já existe uma conexão ativa, reutiliza (essencial no ambiente serverless)
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
            .then((mongooseInstance) => {
                console.log(`✅ MongoDB Conectado: ${mongooseInstance.connection.host}`);
                return mongooseInstance;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error(`❌ Erro crítico ao conectar no MongoDB: ${error.message}`);
        throw error; // Lança o erro para o Express tratar (não mata o processo no Vercel)
    }

    return cached.conn;
};

module.exports = connectDB;
