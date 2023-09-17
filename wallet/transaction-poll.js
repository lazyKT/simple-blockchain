
class TransactionPoll {
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
}


module.exports = TransactionPoll;
