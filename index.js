const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const redis = require("redis");
require('dotenv').config()

const client = require('redis').createClient(process.env.REDIS_URL);

app.get('/', function (req, res) {
    client.set("r", Math.floor(Math.random() * 100));
    client.get("r", function (err, reply) {
        res.send(reply)
    });
});

app.listen(port, function () {
    console.log(`App listening on port ${port}`);
});