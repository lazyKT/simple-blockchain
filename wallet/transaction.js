const { randomUUID } = require('crypto');

class Transaction {

  constructor ({ senderWallet, recipient, amount }) {
    this.id = randomUUID();
    this.outputMap = this.createOutputMap({ senderWallet, recipient, amount });
    this.input = this.createInput({ senderWallet, amount });
  }

  createOutputMap ({ senderWallet, recipient, amount }) {
    const map = {};
    map[recipient] = amount;
    map[senderWallet.publicKey] = senderWallet.balance - amount;
    return map;
  }

  createInput ({ senderWallet }) {
    const input = {};
    input['timestamp'] = Date.now();
    input['amount'] = senderWallet.balance;
    input['address'] = senderWallet.publicKey;
    input['signature'] = senderWallet.sign(this.outputMap);
    return input;
  }
}


module.exports = Transaction;
