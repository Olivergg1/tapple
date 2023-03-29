import dotenv from 'dotenv'
import { connectToPort } from './src/config/configuration'
import { notFound, errorHandler } from './src/middlewares/middlewares'
import express from 'express'
import usersRouter from './src/routes/users/users.routes'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import authRouter from './src/routes/auth/auth.routes'
import { connect } from './src/config/databaseConfig'
import path from 'path'
import session from 'express-session'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Config .env file

dotenv.config()

// Setup express app
const app = express()

app.use([
  helmet(),
  morgan('common'),
  cors(),
  express.json(),
  express.urlencoded({ extended: true }),
  require('cookie-parser')('albert'),
])

//connect()

//console.log(client.connection)

// Setup App session
app.use(
  session({
    secret: 'albert',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 604800000,
    },
  })
)
// app.use(passport.initialize())
//app.use(passport.session())
// setup(passport)

// Init database
// Routes
app.use('/users', usersRouter) // Users
// app.use('/events', require('./src/routes/events/events.routes')) // Events
app.use('/auth', authRouter) // Authentication

app.use('/assignments', assignmentRouter)

//middlewares
app.use([notFound, errorHandler])

const server = createServer(app)
const IOServer = new Server(server, {
  cors: {
    origin: '*',
  },
})

const sendMessage = (message: string) => {
  IOServer.emit('message', message)
  console.log('>>', message)
}

// CHANGE TO USE SQLITE3
const names: any = {}

IOServer.on('connection', (socket) => {
  console.log('a user connected', socket.id)

  socket.on('name:set', (username) => {
    names[socket.id] = username
    sendMessage(username + ' joined the game')

    socket.broadcast.emit('lobby:players', names)
  })

  socket.on('click:source', (msg) => {
    console.log(socket.id, 'clicked something')
    sendMessage(`${names[socket.id]} clicked on ${msg.letter}`)
    socket.broadcast.emit('click:target', { id: msg.id, source: socket.id })
  })

  socket.on('reset:source', () => {
    sendMessage(names[socket.id] + ' has reset the board')
    socket.broadcast.emit('reset:target', { source: socket.id })
  })

  socket.on('disconnect', () => {
    sendMessage(`${names[socket.id]} left the game`)
    delete names[socket.id]
    socket.emit('lobby:players', names)
  })
})

connectToPort(server)
