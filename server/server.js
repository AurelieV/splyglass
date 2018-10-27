const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const passport = require('passport')
const rp = require('request-promise')
const cheerio = require('cheerio')
const eventId = 108

const FacebookTokenStrategy = require('passport-facebook-token')
const {
  facebook: facebookData,
  database: configuration,
  secret,
} = require('./private')
const url = `mongodb+srv://${configuration.user}:${configuration.password}@${
  configuration.url
}`
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(
  expressJwt({
    secret,
    credentialsRequired: false,
    getToken: function(req) {
      if (req.headers['x-auth-token']) {
        return req.headers['x-auth-token']
      }
      return null
    },
  })
)

async function start() {
  const client = await MongoClient.connect(url)
  const db = client.db('test')

  passport.use(
    new FacebookTokenStrategy(facebookData, async function(
      accessToken,
      refreshToken,
      profile,
      done
    ) {
      let user = await db
        .collection('users')
        .findOne({ 'facebookProvider.id': profile.id })
      try {
        if (!user) {
          user = await db.collection('users').insertOne({
            displayName:
              profile.displayName ||
              (profile.name &&
                `${profile.name.givenName} ${$profil.name.middleName} ${
                  profil.name.familyName
                }`) ||
              'Inconnu',
            facebookProvider: { id: profile.id, token: accessToken },
          })
        }
        done(null, user)
      } catch (err) {
        done(err)
      }
    })
  )

  app.use(passport.initialize())

  app.post(
    '/auth/facebook',
    passport.authenticate('facebook-token', { session: false }),
    (req, res) => {
      const token = jwt.sign(
        {
          id: req.user._id,
          displayName: req.user.displayName,
          playerId: req.user.playerId,
        },
        secret,
        { expiresIn: 60 * 60 * 24 * 5 }
      )
      res.setHeader('x-auth-token', token)
      res.json({ user: { displayName: req.user.displayName } })
    }
  )

  app.get('/players', async function(req, res) {
    const collection = db.collection('players')
    const searchText = req.query.search
    const viewAll = req.query.viewAll === 'true'
    let findQuery = {}
    if (searchText) {
      findQuery = {
        $and: [
          { active: true },
          {
            $or: [
              { lastname: { $regex: searchText, $options: 'xi' } },
              { firstname: { $regex: searchText, $options: 'xi' } },
            ],
          },
        ],
      }
    } else {
      findQuery = { active: true }
    }
    try {
      let query = collection.find(findQuery).sort([['lastname', 1]])
      if (!viewAll) {
        query = query.limit(20)
      }
      const players = await query.toArray()
      res.json({
        data: players,
        count: players.length,
      })
    } catch (err) {
      res.status(500).json({ err })
    }
  })

  app.get('/me', async function(req, res) {
    const user = req.user
    if (!user) {
      return res.status(403).send('Unauthorized')
    }
    const dbUser = await db
      .collection('users')
      .findOne({ _id: ObjectId(user.id) })
    return res.json({ data: dbUser })
  })

  app.post('/me/playerId', async function(req, res) {
    const user = req.user
    if (!user) {
      return res.status(403).send('Unauthorized')
    }
    const playerId = req.body.playerId
    const dbUser = await db
      .collection('users')
      .findOneAndUpdate(
        { _id: ObjectId(user.id) },
        { $set: { playerId } },
        { returnOriginal: false }
      )
    res.json({ data: dbUser })
  })

  app.get('/me/matches', async function(req, res) {
    const user = req.user
    if (!user) {
      return res.status(403).send('Unauthorized')
    }
    try {
      const dbOpponents = await db
        .collection('users')
        .aggregate([
          { $match: { _id: ObjectId(user.id) } },
          {
            $unwind: '$opponents',
          },
          {
            $lookup: {
              from: 'players',
              localField: 'opponents',
              foreignField: '_id',
              as: 'players_opponents',
            },
          },
          { $unwind: '$players_opponents' },
          {
            $group: {
              _id: '_id',
              opponents: { $push: '$players_opponents' },
            },
          },
        ])
        .toArray()
      res.json({ data: dbOpponents[0].opponents.map((p) => ({ player: p })) })
    } catch (e) {
      console.log('error', e)
      return res.status(500).send('Unable to fetch')
    }
  })

  app.post('/me/synchronize-matches', async function(req, res) {
    const user = req.user
    if (!user) {
      return res.status(403).send('Unauthorized')
    }
    const playerId = req.body.playerId
    if (!playerId) {
      return res.json({ data: [] })
    }
    const options = {
      uri: `http://pairings.channelfireball.com/personal/${eventId}/${playerId}`,
      useNewUrlParser: true,
      transform: function(body) {
        return cheerio.load(body)
      },
    }
    try {
      const $ = await rp(options)
      const promises = []
      $('.personal-row3')
        .children('.info-block')
        .each(function() {
          const player = $(this)
            .children('.data')
            .children('a')
            .text()
          const [lastname, firstname] = player.split(', ')
          promises.push(
            db.collection('players').findOne({ firstname, lastname })
          )
        })
      const dbPlayers = await Promise.all(promises)
      const opponents = dbPlayers.filter((p) => Boolean(p)).map((p) => p._id)
      const dbUser = await db
        .collection('users')
        .findOneAndUpdate(
          { _id: ObjectId(user.id) },
          { $set: { opponents: opponents } },
          { returnOriginal: false }
        )
      const dbOpponents = await db
        .collection('users')
        .aggregate([
          { $match: { _id: ObjectId(user.id) } },
          {
            $unwind: '$opponents',
          },
          {
            $lookup: {
              from: 'players',
              localField: 'opponents',
              foreignField: '_id',
              as: 'players_opponents',
            },
          },
          { $unwind: '$players_opponents' },
          {
            $group: {
              _id: '_id',
              opponents: { $push: '$players_opponents' },
            },
          },
        ])
        .toArray()
      res.json({ data: dbOpponents[0].opponents.map((p) => ({ player: p })) })
    } catch (e) {
      console.log('error', e)
      return res.status(500).send('Unable to fetch')
    }
  })

  app.get('/stats', async function(req, res) {
    const collection = db.collection('players')
    try {
      const facets = await collection
        .aggregate([
          {
            $match: { active: true },
          },
          { $project: { haveDeck: { $not: '$deck' } } },
          {
            $facet: {
              decks: [{ $sortByCount: '$haveDeck' }],
            },
          },
        ])
        .toArray()
      const stats = facets[0].decks
      const withDeck = (stats.find((s) => !s._id) || {}).count || 0
      const withoutDeck = (stats.find((s) => s._id) || {}).count || 0
      res.json({
        total: withDeck + withoutDeck,
        withDeck,
      })
    } catch (err) {
      res.status(500).json({ err })
    }
  })

  app.get('/scores', async function(req, res) {
    const collection = db.collection('players')
    try {
      const facets = await collection
        .aggregate([
          {
            $project: {
              logs: {
                $filter: {
                  input: '$logs',
                  as: 'log',
                  cond: {
                    $or: [
                      { $eq: ['$$log.action', 'Updated'] },
                      { $eq: ['$$log.action', 'Created'] },
                    ],
                  },
                },
              },
            },
          },
          { $project: { lastLog: { $slice: ['$logs', 1] } } },
          { $project: { lastLog: { $arrayElemAt: ['$lastLog', 0] } } },
          { $project: { lastAuthor: '$lastLog.user' } },
          {
            $group: {
              _id: '$lastAuthor',
              count: { $sum: 1 },
            },
          },
          {
            $sort: { count: -1 },
          },
        ])
        .toArray()
      res.json(facets)
    } catch (err) {
      console.log(err)
      res.status(500).json({ err })
    }
  })

  app.post('/players/:id', async function(req, res) {
    const user = req.user
    if (!user) {
      return res.status(403).send('Unauthorized')
    }
    const id = req.params.id
    const collection = db.collection('players')
    const { firstname, lastname, deck } = req.body
    try {
      const pushRequest = {
        logs: {
          user: user.displayName,
          time: new Date().getTime(),
          action: 'Updated',
          data: { firstname, lastname, deck },
        },
      }
      const { value: player } = await collection.findOneAndUpdate(
        { _id: ObjectId(id) },
        {
          $set: {
            firstname,
            lastname,
            deck,
          },
          $push: pushRequest,
        },
        { returnOriginal: false }
      )
      res.json({ data: player })
    } catch (err) {
      res.status(500).json({ err })
    }
  })
  app.post('/players/:id/comment', async function(req, res) {
    const user = req.user
    if (!user) {
      return res.status(403).send('Unauthorized')
    }
    const id = req.params.id
    const collection = db.collection('players')
    const { comment } = req.body
    try {
      const test = await collection.findOneAndUpdate(
        { _id: ObjectId(id) },
        {
          $push: {
            comments: {
              user: user.displayName,
              time: new Date().getTime(),
              value: comment,
            },
          },
        },
        { returnOriginal: false }
      )
      res.json({ data: test.value })
    } catch (err) {
      res.status(500).json({ err })
      console.log('err', err)
    }
  })

  app.post('/players', async function(req, res) {
    const user = req.user
    if (!user) {
      return res.status(403).send('Unauthorized')
    }
    const collection = db.collection('players')
    const { firstname, lastname, deck, comment } = req.body
    try {
      await collection.insert({
        firstname,
        lastname,
        deck,
        logs: [
          {
            user: user.displayName,
            time: new Date().getTime(),
            action: 'Created',
            data: { firstname, lastname, deck },
          },
        ],
        comments: comment ? [comment] : [],
      })
      res.json({})
    } catch (err) {
      res.status(500).json({ err })
      console.log('err', err)
    }
  })

  app.listen(3600)
}

start()
