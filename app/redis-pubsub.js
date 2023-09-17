const { createClient } = require('redis');
const { randomUUID } = require('crypto');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};


class RedisPubSub {

  constructor ({ blockchain, transactionPoll, publisher, subscriber, subscriberId }) {
    this.blockchain = blockchain;
    this.transactionPoll = transactionPoll;
    this.publisher = publisher;
    this.subscriber = subscriber;
    this.subscriberId = subscriberId;
  }

  static async  builder ({ blockchain, transactionPoll }) {

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

        const parsedMessage = JSON.parse(message);
        if (channel === CHANNELS.BLOCKCHAIN && parsedMessage.subscriberId !== subscriberId) {
          blockchain.replaceChain(parsedMessage.data);
        } else if (channel === CHANNELS.TRANSACTION && parsedMessage.subscriberId !== subscriberId) {
          transactionPoll.setTransaction(parsedMessage.data);
        }
      });
    }

    return new RedisPubSub({ blockchain, transactionPoll, publisher, subscriber, subscriberId });
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
