const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const configuration = require('./database.json');
const url = `mongodb+srv://${configuration.user}:${configuration.password}@${configuration.url}`;

const app = express()
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

async function start() {
  const client = await MongoClient.connect(url);
  const db = client.db('test');

  app.get('/players', async function(req, res) {
    const collection = db.collection('players');
    const searchText = req.query.search;
    let findQuery = {};
    if (searchText) {
      findQuery = {
        $or: [
          {"lastname": {$regex: searchText, $options: "xi" }},
          {"firstname": {$regex: searchText, $options: "xi" }},
        ]
      }
    }
    try {
      const players = await collection.find(findQuery).sort([['lastname', 1]]).toArray();
      res.json({
        data: players,
        count: players.length
      })
    }
    catch (err) {
      res.status(500).json({err});
    }
  })

  app.post('/players/:id', async function(req, res) {
    const id = req.params.id;
    const collection = db.collection('players');
    const {firstname, lastname, deck, comment} = req.body;
    try {
      const pushRequest = {
        logs: {user: 'Anonymous', time: (new Date()).getTime(), action: 'Updated', data: {firstname, lastname, deck }}
      }
      if (comment) {
        pushRequest.comments = {user: 'Anonymous', time: (new Date()).getTime(), value: comment};
      }
      const {value: player} = await collection.findOneAndUpdate(
        {_id: ObjectId(id)},
        {
          $set: {
            firstname,
            lastname,
            deck
          },
          $push: pushRequest
        },
        {returnOriginal: false}
      )
      res.json({data: player});
    }
    catch (err) {
      res.status(500).json({err});
    }
  })
  app.post('/players/:id/comment', async function(req, res) {
    const id = req.params.id;
    const collection = db.collection('players');
    const {comment} = req.body;
    try {
      const test = await collection.findOneAndUpdate(
        {_id: ObjectId(id)},
        {
          $push: {comments: {user: 'Anonymous', time: (new Date()).getTime(), value: comment}}
        },
        {returnOriginal: false}
      )
      res.json({data: test.value});
    }
    catch (err) {
      res.status(500).json({err});
      console.log("err", err);
    }
  })

  app.post('/players', async function(req, res) {
    const collection = db.collection('players');
    const {firstname, lastname, deck} = req.body;
    try {
      await collection.insert({
        firstname,
        lastname,
        deck,
        logs: [
          { user: 'Anonymous', time: (new Date()).getTime(), action: 'Created', data: {firstname, lastname, deck }}
        ],
        comments: comment ? [comment] : []
      });
      res.json({});
    }
    catch (err) {
      res.status(500).json({err});
    }
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