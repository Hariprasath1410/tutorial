const express = require('express')
const app = express()
let db = null
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
app.use(express.json())
const bcrypt = require('bcrypt')

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
    console.log(`DB Error: ${e.message}`)
  }
}

initializeDBAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `
    SELECT * FROM user WHERE username='${username}';
    `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    if (password.length >= 5) {
      const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`
      await db.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';
    `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  if (newPassword.length < 5) {
    response.status(400)
    response.send('Password is too short')
    return
  }

  const userQuery = `SELECT password FROM user WHERE username = '${username}';`
  const user = await db.get(userQuery)
  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password)
  if (!isPasswordMatched) {
    response.status(400)
    response.send('Invalid current password')
    return
  } else {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const updatePasswordQuery = `UPDATE user SET password = ? WHERE username = ?;`
    await db.run(updatePasswordQuery, [hashedPassword, username])

    response.status(200)
    response.send('Password updated')
    return
  }
})

module.exports = app
