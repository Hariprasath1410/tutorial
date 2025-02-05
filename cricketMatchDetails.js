const express = require('express')
const app = express()
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
app.use(express.json())

let db = null

const initialzeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running Successfully...')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}

initialzeDBAndServer()

const convertDBObjectToResponseObject1 = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertDBObjectToResponseObject2 = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

const convertDBObjectToResponseObject3 = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
  SELECT * FROM player_details;
  `
  const playerArray = await db.all(getPlayersQuery)
  response.send(
    playerArray.map(eachPlayer => convertDBObjectToResponseObject1(eachPlayer)),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
  SELECT * FROM player_details WHERE player_id=${playerId}
  `
  const player = await db.get(getPlayerQuery)
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  })
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const playerUpdateQuery = `
  UPDATE player_details SET 
  player_name='${playerName}'
  WHERE player_id=${playerId};
  `
  await db.run(playerUpdateQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `
  SELECT * FROM match_details WHERE match_id=${matchId};
  `
  const matchDetails = await db.get(getMatchQuery)
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  })
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchDetails = `
  SELECT * FROM match_details join player_match_score ON 
  match_details.match_id=player_match_score.match_id WHERE player_match_score.player_id=${playerId}
  `
  const matchDetails = await db.all(getMatchDetails)
  response.send(
    matchDetails.map(eachMatch => convertDBObjectToResponseObject2(eachMatch)),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersList = `
  SELECT * FROM player_details join player_match_score ON player_details.player_id= player_match_score.player_id 
  WHERE player_match_score.match_id=${matchId};
  `
  const playerList = await db.all(getPlayersList)
  response.send(
    playerList.map(eachMatch => convertDBObjectToResponseObject3(eachMatch)),
  )
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getStatsQuery = `
    SELECT player_match_score.player_id AS playerId,
    player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore, 
      SUM(player_match_score.fours) AS totalFours, 
      SUM(player_match_score.sixes) AS totalSixes 
    FROM player_match_score join player_details ON player_match_score.player_id = player_details.player_id  
    WHERE player_match_score.player_id = ${playerId};
  `

  const playerStats = await db.get(getStatsQuery)

  response.send({
    playerId: playerStats.playerId,
    playerName: playerStats.playerName,
    totalScore: playerStats.totalScore,
    totalFours: playerStats.totalFours,
    totalSixes: playerStats.totalSixes,
  })
})

module.exports = app
