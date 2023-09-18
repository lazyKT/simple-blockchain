const { createClient } = require('redis');
const { randomUUID } = require('crypto');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};


class RedisPubSub {

  constructor ({ blockchain, transactionPool, publisher, subscriber, subscriberId }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.publisher = publisher;
    this.subscriber = subscriber;
    this.subscriberId = subscriberId;
  }

  static async  builder ({ blockchain, transactionPool }) {

    // generate subscriber id to prevent processing of self-broadcast messages
    const subscriberId = randomUUID();

    const publisher = createClient();
    publisher.on('error', (err) => console.error(`[publisher-err] ${err}`));
    await publisher.connect();

    const subscriber = publisher.duplicate();
    subscriber.on('error', (err) => console.error(`[subscriber-err] ${err}`));
    await subscriber.connect();
    
    for (const ch of Object.values(CHANNELS)) {
      await subscriber.subscribe(ch, (message, channel) => {
        this.processMessages(channel, message, blockchain, transactionPool, subscriberId);
      });
    }

    return new RedisPubSub({ blockchain, transactionPool, publisher, subscriber, subscriberId });
  }

  static processMessages (channel, message, blockchain, transactionPool, subscriberId) {
    const parsedMessage = JSON.parse(message);
    if (channel === CHANNELS.BLOCKCHAIN && parsedMessage.subscriberId !== subscriberId) {
      const chain = parsedMessage.data;
      blockchain.replaceChain(chain, true, () => {
        transactionPool.clearBlockchainTransactions({ chain });
      });
    } else if (channel === CHANNELS.TRANSACTION && parsedMessage.subscriberId !== subscriberId) {
      transactionPool.setTransaction(parsedMessage.data);
    }
  }

  async publish (channel, message) {
    await this.publisher.publish(channel, message);
  }

  async broadcastChain () {
    await this.publish(
      CHANNELS.BLOCKCHAIN, 
      JSON.stringify({subscriberId: this.subscriberId, data: this.blockchain.chain})
    );
  }

  async broadcastTransaction (transaction) {
    await this.publish(
      CHANNELS.TRANSACTION, 
      JSON.stringify({subscriberId: this.subscriberId, data: transaction})
    );
  }
}


module.exports = RedisPubSub;
