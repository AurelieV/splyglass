const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const configuration = require('./database.json');
const url = `mongodb+srv://${configuration.user}:${configuration.password}@${configuration.url}`;

const app = express()
app.use(bodyParser.urlencoded({extended: true}))

async function start() {
  const client = await MongoClient.connect(url);
  const db = client.db('test');

  app.get('/players', async function(req, res) {
    const collection = db.collection('players');
    const players = await collection.find({}).toArray();
    res.json({
      data: players,
      count: players.length
    })
  })

  app.listen(3600);
}

start();








// async function read() {
//   try {
//     const client = await MongoClient.connect(url);
//     const db = client.db('test');
//     const collection = db.collection('players');
//     const test = await collection.find({}).toArray();
//     console.log(test);

//     client.close();
//   } catch (e) {
//     console.log(e)
//   }
// }

// read();