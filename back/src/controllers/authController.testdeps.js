// Helper de teste (não é uma suíte): re-exporta o emailService via require CJS.
// No vitest, `import` (ESM) e `require` (CJS) de um módulo CommonJS retornam objetos
// DIFERENTES. O authController consome o emailService via require, então para espionar
// a função que ele realmente chama, o teste precisa obter a mesma instância CJS — é o
// que esta ponte entrega (require compartilha o cache CJS do vitest com o controller).
module.exports = require('../utils/emailService');
