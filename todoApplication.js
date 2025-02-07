const express = require('express')
const app = express()
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
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

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
  SELECT * FROM todo WHERE id=${todoId};
  `
  const getTodo = await db.get(getTodoQuery)
  response.send(getTodo)
})

app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const createTodoQuery = `
  INSERT INTO todo(id, todo, priority, status)
  VALUES (
    ${id},
    '${todo}',
    '${priority}',
    '${status}'
  );
  `
  await db.run(createTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateQuery = ''
  const {status, priority, todo} = request.body
  let responseMessage = ''
  if (status !== undefined) {
    updateQuery = `UPDATE todo SET status ='${status}' WHERE id =${todoId};`
    await db.run(updateQuery)
    responseMessage = 'Status Updated'
  } else if (priority !== undefined) {
    updateQuery = `UPDATE todo SET priority ='${priority}' WHERE id =${todoId};`
    await db.run(updateQuery)
    responseMessage = 'Priority Updated'
  } else if (todo !== undefined) {
    updateQuery = `UPDATE todo SET todo ='${todo}' WHERE id =${todoId};`
    await db.run(updateQuery)
    responseMessage = 'Todo Updated'
  }

  response.send(responseMessage)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoDeleteQuery = `
  DELETE FROM todo WHERE id=${todoId};`
  await db.run(todoDeleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
