const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
// const PubSub = require('./pubsub');
const RedisPubSub = require('./redis-pubsub');

const app = express();
app.use(bodyParser.json());

const blockchain = new Blockchain();
let pubsub = null;

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;


setTimeout(() => pubsub.broadcastChain(), 1000);

app.get('/api/blocks', (req, res) => {
    res.send(blockchain.chain);
});


app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock(({ data }));

    pubsub.broadcastChain();

    res.redirect('/api/blocks');
});


// sync the chain of new nodes with the chain of root node at the server start up
const syncChain = () => {
    // making request to root node `GET:: /api/blocks`
    // sync the response with the current node's chain
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);
            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });
}


let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, async () => {
    console.log(`app is running at localhost:${PORT}`);
    pubsub = await RedisPubSub.builder({ blockchain });
    // only sync for the non-root node
    if (PORT !== DEFAULT_PORT) {
        syncChain();
    }
});
