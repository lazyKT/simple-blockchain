const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactionMap = {};
  }

  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  getTransaction({ inputAddress }) {
    const transactions = Object.values(this.transactionMap);

    return transactions.find((tranasction) => tranasction.input.address === inputAddress);
  }

  setMap(transactionPollMap) {
    this.transactionMap = transactionPollMap;
  }

  getValidTranscations () {
    const transactions = Object.values(this.transactionMap);

    return transactions.filter((transaction) => {
      try {
        return Transaction.validateTransaction(transaction);
      } catch (err) {
        return false;
      }
    });
  }

  clearBlockchainTransactions ({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];

      for(let transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    }
  }

  clear() {
    this.transactionMap = {};
  }
}


module.exports = TransactionPool;
