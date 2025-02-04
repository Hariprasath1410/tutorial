const express = require('express')
const app = express()

const path = require('path')
const dbPath = path.join(__dirname, 'moviesData.db')
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
      console.log('Server Running Successfully...')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}

const convertDbObjectToResponseObject1 = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

const convertDbObjectToResponseObject2 = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const convertDbObjectToResponseObject3 = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

const convertDbObjectToResponseObject4 = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

initializeDBAndServer()

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name FROM movie;
    `
  const movieArray = await db.all(getMoviesQuery)
  response.send(
    movieArray.map(eachMovie => convertDbObjectToResponseObject1(eachMovie)),
  )
})

app.use(express.json())

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
    INSERT INTO movie(director_id, movie_name, lead_actor) 
    VALUES (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );`
  const dbResponse = await db.run(addMovieQuery)
  const movieId = dbResponse.lastID
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovie = `
  SELECT * FROM movie WHERE movie_id = ${movieId};
  `
  const movie = await db.get(getMovie)
  response.send(convertDbObjectToResponseObject2(movie))
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const updateMovieDetails = `
  UPDATE movie SET director_id=${directorId},
  movie_name='${movieName}',
  lead_actor='${leadActor}' WHERE movie_id=${movieId};
  `
  await db.run(updateMovieDetails)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDeleteQuery = `
  DELETE FROM movie WHERE movie_id=${movieId};
  `
  await db.run(movieDeleteQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorQuery = `
  SELECT * FROM director;
  `
  const directorArray = await db.all(getDirectorQuery)
  response.send(
    directorArray.map(eachDirector =>
      convertDbObjectToResponseObject3(eachDirector),
    ),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getMovieList = `
  SELECT movie_name FROM movie 
  WHERE director_id='${directorId}';`
  const directorArray = await db.all(getMovieList)
  response.send(
    directorArray.map(eachMovie => convertDbObjectToResponseObject4(eachMovie)),
  )
})

module.exports = app
