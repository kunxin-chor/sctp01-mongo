const crypto = require('crypto');

function generateJwtSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

const jwtSecret = generateJwtSecret();
console.log('JWT Secret:', jwtSecret);