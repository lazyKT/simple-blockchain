const { STARTING_BALANCE } = require("../config");
const { ec, cryptoHash } = require('../utils');

class Wallet {
  constructor () {
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair();

    this.publicKey = this.keyPair.getPublic().encode('hex');
  }


  sign (data) {
    const dataHash = cryptoHash(data);
    return this.keyPair.sign(dataHash);
  }
}


module.exports = Wallet;
