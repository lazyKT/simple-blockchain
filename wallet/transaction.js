const { randomUUID } = require('crypto');
const { MINING_REWARD, REWARD_INPUT } = require('../config');
const { verifySignature } = require('../utils');

class Transaction {

  constructor ({ senderWallet, recipient, amount, outputMap, input }) {
    this.id = randomUUID();
    this.outputMap = outputMap ?? this.createOutputMap({ senderWallet, recipient, amount });
    this.input = input ?? this.createInput({ senderWallet, amount });
  }

  createOutputMap ({ senderWallet, recipient, amount }) {
    const map = {};
    map[recipient] = amount; // amount sent
    map[senderWallet.publicKey] = senderWallet.balance - amount; // amount left
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

  update ({ senderWallet, recipient, amount }) {
    if (amount > this.outputMap[senderWallet.publicKey]) {
      throw new Error('Amount exceeds balance');
    }

    this.outputMap[recipient] = amount + (this.outputMap[recipient] ?? 0);
    this.outputMap[senderWallet.publicKey] = this.outputMap[senderWallet.publicKey] - amount;

    // sign the input
    this.input = this.createInput({ senderWallet  });
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

  static rewardTransaction({ minerWallet }) {
    return new this({
      input: REWARD_INPUT,
      outputMap: {
        [minerWallet.publicKey]: MINING_REWARD
      }
    });
  }

}


module.exports = Transaction;
