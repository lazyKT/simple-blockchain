const { createClient } = require('redis');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN'
};


class RedisPubSub {

  constructor ({ blockchain, publisher, subscriber }) {
    this.blockchain = blockchain;
    this.publisher = publisher;
    this.subscriber = subscriber;
  }

  static async  builder ({ blockchain }) {
    const publisher = createClient();
    publisher.on('error', (err) => console.error(`[publisher-err] ${err}`));
    await publisher.connect();

    const subscriber = publisher.duplicate();
    subscriber.on('error', (err) => console.error(`[subscriber-err] ${err}`));
    await subscriber.connect();

    for (const ch of Object.values(CHANNELS)) {
      await subscriber.subscribe(ch, (message, channel) => {
        console.log(`Message received. Channel: ${channel}, Message: ${message}`);
        // console.log(`\nch === CHANNELS.BLOCKCHAIN && channel === CHANNELS.BLOCKCHAIN: ${ch === CHANNELS.BLOCKCHAIN && channel === CHANNELS.BLOCKCHAIN}`)
        if (channel === CHANNELS.BLOCKCHAIN) {
          const chain = JSON.parse(message);
          blockchain.replaceChain(chain);
        }
      });
    }

    return new RedisPubSub({ blockchain, publisher, subscriber });
  }

  async publish (channel, message) {
    await this.publisher.publish(channel, message);
  }

  async broadcastChain () {
    await this.publish(CHANNELS.BLOCKCHAIN, JSON.stringify(this.blockchain.chain));
  }
}


module.exports = RedisPubSub;
