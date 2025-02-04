const express = require('express')
const app = express()
const path = require('path')
const dbPath = path.join(__dirname, 'covid19India.db')
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

const convertDbObjectToResponseObject1 = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDbObjectToResponseObject2 = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;
    `
  const stateArray = await db.all(getStatesQuery)
  response.send(
    stateArray.map(eachState => convertDbObjectToResponseObject1(eachState)),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getState = `
  SELECT * FROM state WHERE state_id=${stateId};
  `
  const state = await db.get(getState)
  response.send(convertDbObjectToResponseObject1(state))
})

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictQuery = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active}, 
        ${deaths}
    );
    `
  const dbResponse = await db.run(addDistrictQuery)
  const districtId = dbResponse.lastId
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const getDistrict = `
    SELECT * FROM district WHERE district_id=${districtId};
    `
  const district = await db.get(getDistrict)
  response.send(convertDbObjectToResponseObject2(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDeleteQuery = `
    DELETE FROM district WHERE district_id=${districtId};
    `
  await db.run(districtDeleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const districtUpdateQuery = `
    UPDATE district SET district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths};
    `
  await db.run(districtUpdateQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
    SELECT 
      SUM(cases) AS totalCases, 
      SUM(cured) AS totalCured, 
      SUM(active) AS totalActive, 
      SUM(deaths) AS totalDeaths
    FROM district 
    WHERE state_id = ${stateId};
  `

  const stateStats = await db.get(getStatsQuery)

  response.send({
    totalCases: stateStats.totalCases,
    totalCured: stateStats.totalCured,
    totalActive: stateStats.totalActive,
    totalDeaths: stateStats.totalDeaths,
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getState = `
    SELECT state.state_name AS stateName FROM state JOIN district ON 
    state.state_id = district.state_id WHERE district_id=${districtId};
    `
  const state = await db.get(getState)
  response.send(state)
})

module.exports = app
