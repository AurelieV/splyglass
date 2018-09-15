const MongoClient = require('mongodb').MongoClient
const configuration = require('./private.json').database
const url = `mongodb+srv://${configuration.user}:${configuration.password}@${
  configuration.url
}`

const minScore = 15

async function start() {
  try {
    const client = await MongoClient.connect(url)
    const db = client.db('test')
    const collection = db.collection('players')

    let players = await collection.find({}).toArray()
    const nbActivePlayers = players.filter((player) => player.score >= minScore)
      .length

    const results = await Promise.all(
      players.map((player) =>
        collection.findOneAndUpdate(
          { _id: player._id },
          {
            $set: {
              active: player.score >= minScore,
            },
          },
          { upsert: true }
        )
      )
    )
    console.log(`${nbActivePlayers} active players`)

    client.close()
  } catch (err) {
    console.log('Error', err)
  }
}

start()
