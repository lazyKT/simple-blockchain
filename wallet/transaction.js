const { randomUUID } = require('crypto');
const { verifySignature } = require('../utils');

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

  static validateTransaction (transaction) {
    const { 
      input: { address, amount, signature}, 
      outputMap 
    } = transaction;

    const outputTotal = Object.values(outputMap).reduce((total, amt) => total + amt);
    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);
      return false;
    }

    const isValidSignature = verifySignature({
      publicKey: address,
      data: outputMap,
      signature
    });
    if (!isValidSignature) {
      console.error(`Invalid signature from ${address}`);
      return false;
    }

    return true;
  }
}


module.exports = Transaction;
