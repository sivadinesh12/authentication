const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const databasePath = path.join(__dirname, 'userData.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

// register
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const encryptPassword = await bcrypt.hash(password, 10)
  const passWordLength = password.length
  const checkUserQuery = `
  SELECT * 
  FROM user 
  WHERE username = '${username}';`
  const user = await database.get(checkUserQuery)

  if (user === undefined) {
    if (passWordLength >= 5) {
      const createUserQuery = `
      INSERT INTO 
      user(username,name,password,gender,location)
      VALUES 
      ('${username}','${name}','${encryptPassword}','${gender}','${location}');`
      await database.run(createUserQuery)
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


// login 

app.post('/login',async (request,response)=>{
  const {username,password} = request.body
  const checkUserQuery = `
  SELECT *
  FROM user
  WHERE username = '${username}';`;
  const user = await database.get(checkUserQuery);

  if (user === undefined){
    response.status(400)
    response.send("Invalid user")
  }
  else{
    const isValidPassword = await bcrypt.compare(password,user.password);
    if(isValidPassword === true){
      response.status(200)
      response.send("Login success!");
    }
    else{
      response.status(400)
      response.send("Invalid password")
    }
  }
})


// update password 

app.put('/change-password',async (request,response)=>{
  const {username,oldPassword,newPassword} = request.body;
  const getUserQuery = `
  SELECT *
  FROM user
  WHERE username = '${username}';`;
  const user = await database.get(getUserQuery);
  const newPasswordLength = newPassword.length;
  
  if(user === undefined){
    response.status(400)
    response.send("Invalid user")
  }
  else {
    const isValidPassword = await bcrypt.compare(oldPassword,user.password);
    if(isValidPassword === true){
      if(newPasswordLength < 5){
         response.status(400)
         response.send("Password is too short");
      }
      else{
        const encryptPassword = await bcrypt.hash(newPassword);
        const updatePasswordQuery = `
        UPDATE user
        SET
        password = '${encryptPassword}'
        WHERE 
        username = '${username}';`;
        await database.run(updatePasswordQuery);
        response.status(200)
        response.send("Password updated");
      }
  }
  else{
    response.status(400);
    response.send('Invalid current password');
  }
  }
})

module.exports = app
