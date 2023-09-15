const crypto = require('crypto');

const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');
    const inputStrings = inputs.map((input) => JSON.stringify(input));
    hash.update(inputStrings.sort().join(' '));
    return hash.digest('hex');
};


module.exports = cryptoHash;
