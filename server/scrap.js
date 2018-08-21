const rp = require('request-promise');
const cheerio = require('cheerio');

const MongoClient = require('mongodb').MongoClient;
const configuration = require('./database.json');
const url = `mongodb+srv://${configuration.user}:${configuration.password}@${configuration.url}`;

const eventId = 96;
const options = {
  uri: `http://pairings.channelfireball.com/personal/${eventId}`,
  useNewUrlParser: true,
  transform: function (body) {
    return cheerio.load(body);
  }
};

const playerRegexp = /^(.+), (.+) \((\d)+\)$/g;

async function start() {
  try {
    const $ = await rp(options);
    let players = [];
    $('#playerlist').children('option').each(function() {
      const info = playerRegexp.exec($(this).text());
      if (!info) return;
      const [,lastname, firstname] = info;
      const playerId = $(this).attr('value');

      players.push({
        lastname,
        firstname,
        playerId
      })
    })

    const client = await MongoClient.connect(url);
    const db = client.db('test');
    const collection = db.collection('players');
    await Promise.all(players.map(player =>
      collection.findOneAndUpdate({ playerId: player.playerId }, {$set: player}, {
        returnOriginal: false,
        upsert: true
      })
    ));

    client.close();
  }
  catch (err) {
    console.log("Error", err);
  }
}

start();