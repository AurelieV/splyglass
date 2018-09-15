const rp = require('request-promise')
const cheerio = require('cheerio')

const MongoClient = require('mongodb').MongoClient
const configuration = require('./private.json').database
const url = `mongodb+srv://${configuration.user}:${configuration.password}@${
  configuration.url
}`

const eventId = 104
const options = {
  uri: `http://pairings.channelfireball.com/personal/${eventId}`,
  useNewUrlParser: true,
  transform: function(body) {
    return cheerio.load(body)
  },
}

const playerRegexp = /^(.+), (.+) \((\d+)\)$/

async function start() {
  try {
    const $ = await rp(options)
    let players = []
    $('#playerlist')
      .children('option')
      .each(function() {
        const info = playerRegexp.exec($(this).text())
        if (!info) {
          console.log('Parse error', $(this).text())
          return
        }
        const [, lastname, firstname, score] = info
        const playerId = $(this).attr('value')

        players.push({
          lastname,
          firstname,
          playerId,
          active: true,
          score: Number(score),
          logs: [
            {
              user: 'Auto',
              time: new Date().getTime(),
              action: 'Imported',
              data: { firstname, lastname },
            },
          ],
        })
      })

    console.log(`${players.length} scrapped`)

    const client = await MongoClient.connect(url)
    const db = client.db('test')
    const collection = db.collection('players')
    const results = await Promise.all(
      players.map((player) =>
        collection.findOneAndUpdate(
          { firstname: player.firstname, lastname: player.lastname },
          { $set: player },
          { upsert: true }
        )
      )
    )
    const newPlayers = results.filter(
      (result) => !result.lastErrorObject.updatedExisting
    )
    const updatedPlayer = results.filter(
      (result) => result.lastErrorObject.updatedExisting
    )
    console.log(`${newPlayers.length} new players inserted`)
    console.log(`${updatedPlayer.length} players updated`)

    client.close()
  } catch (err) {
    console.log('Error', err)
  }
}

start()
