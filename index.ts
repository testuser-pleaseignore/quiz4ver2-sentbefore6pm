import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'
import fs from 'fs'


const app = express()
const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"
app.use(bodyParser.json())
app.use(cors())

interface DbSchema {
  users: User[]
}

interface User {
  username: string
  password: string
  firstname: string
  lastname: string
  balance: number
}

interface JWTPayload {
  username: string;
  password: string;
}

const readDbFile = ():DbSchema => {
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  return db
}

app.post('/login',
  (req, res) => {
    // Use username and password to create token.
    const { username, password } = req.body
    const db = readDbFile()
    const user = db.users.find((data : any) => data.username === username)
    if (!user) {
      res.status(400)
      res.json({ message: "Invalid username or password" })
      return
    }
    if (!bcrypt.compareSync(password, user.password)) {
      res.status(400)
      res.json({ message: "Invalid username or password" })
      return
    }
    const token = jwt.sign({username: user.username,password: user.password } as JWTPayload , SECRET)
    return res.status(200).json({ message:"Login successfully", token})
  }
)
app.post('/register',
  (req, res) => {

    const { username, password, firstname, lastname, balance } = req.body
    const errors = validationResult(req)
      const db = readDbFile()
      if (db.users.find((data: any) => data.username == username)) {
        res.status(400).json({message: "This username is already in used."})
        return
      }
      const passwordhasher = bcrypt.hashSync(password, 16)
      db.users.push({
        username,
        password: passwordhasher,
        firstname,
        lastname,
        balance 
      })
      fs.writeFileSync('db.json', JSON.stringify(db,null,2))
      res.status(200).json({ message: "Register complete" })
    })

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const db = readDbFile()
      const user = db.users.find(data => data.username === username)
      if(user){
        res.status(200).json({name: user.firstname + " " + user.lastname,
                              balance: user.balance})
      }
    }
    catch (e) {
      //response in case of invalid token
      res.status(400).json({message:"Invalid token"})
    }
  })

app.post('/deposit',
  body('amount').isInt({ min: 1 }),
  (req, res) => {

    //Is amount <= 0 ?
    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })
  })

app.post('/withdraw',
  (req, res) => {
  })

app.delete('/reset', (req, res) => {

  //code your database reset here
  fs.writeFileSync('db.json', JSON.stringify({users:[]}))
  return res.status(200).json({
    message: 'Reset database successfully'
  })
})

app.get('/me', (req, res) => {
  return res.status(200).json({ "firstname": "Waradorn",
  "lastname" : "Siripunt",
  "code" : 620612163,
  "gpa" : 1.99})

})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))