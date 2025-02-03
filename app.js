const express = require('express')
const app = express()
const path = require('path')
const dbPath = path.join(__dirname, 'cricketTeam.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running...')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}
const convertDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  }
}
initializeDBAndServer()

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
 SELECT
 *
 FROM
 cricket_team;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer => convertDbObjectToResponseObject(eachPlayer)),
  )
})

app.use(express.json())

app.post('/players/', async (request, response) => {
  const playerDetails = request.body
  const {playerName, jerseyNumber, role} = playerDetails
  const addPlayerQuery = `
    INSERT INTO cricket_team(player_name, jersey_number, role)
    VALUES  (
        '${playerName}',
        ${jerseyNumber},
        '${role}'
    );`
  const dbResponse = await db.run(addPlayerQuery)
  const playerId = dbResponse.lastID
  response.send('Player Added to Team')
  console.log(dbResponse)
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayer = `
  SELECT * FROM cricket_team 
  WHERE player_id = ${playerId};`
  const player = await db.get(getPlayer)
  response.send(convertDbObjectToResponseObject(player))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName, jerseyNumber, role} = playerDetails
  const updatePlayerQuery = `
  UPDATE cricket_team 
  SET player_name='${playerName}',
  jersey_number=${jerseyNumber},
  role='${role}'
  WHERE 
  player_id = ${playerId};
  `
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

app.delete('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const deletePlayerQuery = `
  DELETE FROM cricket_team WHERE player_id = ${playerId}`
  await db.run(deletePlayerQuery)
  response.send('Player Removed')
})

module.exports = app
