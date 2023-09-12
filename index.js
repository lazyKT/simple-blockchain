const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');

const app = express();
app.use(bodyParser.json());

const blockchain = new Blockchain();


app.get('/api/blocks', (req, res) => {
    res.send(blockchain.chain);
});


app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock(({ data }));

    res.redirect('/api/blocks');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`app is running at localhost:${PORT}`);
});
