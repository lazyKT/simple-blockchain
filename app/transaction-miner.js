const Transaction = require("../wallet/transaction");

class TransactionMiner {

  constructor ({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  mineTransactions () {
    // get the transaction pool's valid transaction
    const validTransactions = this.transactionPool.getValidTransactions();

    // generate the miner's reward
    validTransactions.push(Transaction.rewardTransaction({ minerWallet: this.wallet }));

    // add a block consisting to these transactions to the blockchain
    this.blockchain.addBlock({ data: validTransactions });

    // broadcast the updated blockchain
    this.pubsub.broadcastChain();

    // clear the transaction pool
    this.transactionPool.clear();
  }
}


module.exports = TransactionMiner;
