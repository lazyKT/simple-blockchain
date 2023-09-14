const { createClient } = require('redis');

// (async () => {
//   const client = createClient();
//   client.on('error', (err) => console.error('Error', err));
//   await client.connect();

//   const subscriber = client.duplicate();
//   subscriber.on('error', err => console.error(err));
//   await subscriber.connect();

//   await subscriber.subscribe('test', (message, channel) => {
//     console.log(`Message: ${message}. Channel: ${channel}`);
//   });

//   await client.publish('test', 'Hello! Is there anybody in there?');
// })();

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

    for (let i = 0; i < Object.values(CHANNELS).length; i++) {
      const ch = Object.values(CHANNELS)[i];
      await subscriber.subscribe(ch, (channel, message) => {
        console.log(`Message received. Channel: ${channel}, Message: ${message}`);
        if (ch === CHANNELS.BLOCKCHAIN && channel === CHANNELS.BLOCKCHAIN) {
          const chain = JSON.parse(message);
          blockchain.replaceChain(chain);
        }
      });
    }

    return new RedisPubSub({ blockchain, publisher, subscriber });
  }

  // async subscribe () {
  //   await this.subscriber.subscribe('test', (messageObject) => {
  //     console.log(`messageObject: ${messageObject}`);
  //   });
  // }

  async publish (channel, message) {
    await this.publisher.publish(channel, message);
  }

  async broadcastChain () {
    await this.publish(CHANNELS.BLOCKCHAIN, JSON.stringify(this.blockchain.chain));
  }
}


// (async () => {
//   const blockchain = new Blockchain();
//   const pubsub = await RedisPubSub.builder({ blockchain });
//   // await pubsub.subscribe();
//   await pubsub.publish('Hello is there anybody in there?');
// })()


module.exports = RedisPubSub;
