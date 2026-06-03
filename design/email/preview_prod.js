// Generates HTML from the REAL production templates (with the logo pointed at the local PNG)
// so we can screenshot exactly what email clients will receive.
const path = require('path');
const fs = require('fs');

const logoPath = path.resolve(__dirname, '..', '..', 'front', 'public', 'email-logo.png');
process.env.EMAIL_LOGO_URL = 'file:///' + logoPath.replace(/\\/g, '/');

const { verificationEmail, passwordResetEmail } = require(
    path.resolve(__dirname, '..', '..', 'back', 'src', 'utils', 'emailTemplates.js')
);

fs.writeFileSync(path.join(__dirname, '_prod_verify.html'),
    verificationEmail({ name: 'Kauã', code: '284913' }), 'utf-8');
fs.writeFileSync(path.join(__dirname, '_prod_reset.html'),
    passwordResetEmail({ name: 'Kauã', code: '519740' }), 'utf-8');
console.log('wrote _prod_verify.html and _prod_reset.html');
