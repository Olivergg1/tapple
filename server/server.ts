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
import ip from 'ip'

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

console.log('Your IP:', ip.address())

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

const assignAvatar = () => {
  const avatars =
    '💩,👻,😎,🧠,👔,🧢,🐶,🐱,🐭,🐹,🐰,🦊,🐻,🐼,🐨,🐯,🦁,🐮,🐷'.split(',')
  const index = Math.floor(Math.random() * avatars.length)
  console.log(avatars[index], index)
  return avatars[index]
}

interface Player {
  username: string
  id: string
  avatar: string
}

// CHANGE TO USE SQLITE3
type GameState = 'running' | 'ended' | 'loading' | 'waiting'
let timeout: NodeJS.Timeout | undefined = undefined

interface IGame {
  players: Player[]
  host?: Player
  turn?: Player
  turnIndex: number | 0
}

const Game: IGame = {
  players: [],
  host: undefined,
  turn: undefined,
  turnIndex: 0
}

// Returns the index to a random player
const getRandomPlayer = (): number => {
  return Math.round(Math.random() * (Game.players.length - 1))
}

const setTurn = (index: number) => {
  Game.turn = Game.players[index]
  Game.turnIndex = index
  console.log(`It is now ${Game.turn.username}'s turn`)
}

const getPlayer = (id: string) => {
  return Game.players.find((player) => player.id === id)
}

const isHost = (playerID: string): boolean => {
  return playerID === Game.host?.id
}

// Starts a new game timer on demand, within range of min-max milliseconds
const startTimer = (min: number, max: number, onTimesOut: Function) => {
  let duration = Math.random() * (max - min) + min
  console.log('Starting a new timer with a duration of', duration, 'ms')

  timeout = setTimeout(() => {
    onTimesOut()
    if (typeof timeout === 'number') {
      clearTimeout(timeout)
    }
  }, duration)
}

IOServer.on('connection', (client) => {
  console.log('a user connected', client.id)

  client.on('name:set', (username) => {
    const player: Player = { username, id: client.id, avatar: assignAvatar() }

    console.log(player)
    Game.players.push(player)
    console.log(Game.players)
    sendMessage(username + ' joined the game')

    client.emit('lobby:players', Game.players)
    client.broadcast.emit('lobby:players', Game.players)

    // Check if first player to join
    if (Game.players.length === 1) {
      Game.host = Game.players[0]
      IOServer.emit('game:state', { state: 'new_host', host: Game.host })
      console.log(Game.host.username, 'was set as new host')
    }

    client.emit('me:init', player)
  })

  // Start game on request
  client.on('game:start', ({ min, max }) => {
    // Check whether the request is sent from a host
    if (isHost(client.id) === false) return

    // Start game timer
    startTimer(min, max, () => {
      IOServer.emit('game:state', { state: 'ended' })
      const t = setTimeout(() => {
        IOServer.emit('game:state', { state: 'waiting' })
        clearTimeout(t)
      }, 5000)
    })


    // Notify players by changing game state
    IOServer.emit('game:state', { state: 'running' })

    // TODO: change for better error handling!
    const indexOfPlayer = getRandomPlayer()
    setTurn(indexOfPlayer)
    IOServer.emit("game:turn", Game.turn)
  })

  const nextPlayer = (): number => (Game.turnIndex += 1) % Game.players.length

  client.on('click:source', (msg) => {
    console.log(msg)
    // Skip if click is not from turn
    if (client.id !== Game.turn?.id) return

    // Set turn to next player
    setTurn(nextPlayer())
    client.broadcast.emit('click:target', { id: msg.id, source: client.id })
    IOServer.emit("game:turn", Game.turn)
  })

  client.on('reset:source', () => {
    sendMessage(getPlayer(client.id) + ' has reset the board')
    client.broadcast.emit('reset:target', { source: client.id })
  })

  client.on('disconnect', () => {
    sendMessage(`${getPlayer(client.id)?.username} left the game`)
    const [deletedPlayer] = Game.players.splice(
      Game.players.findIndex((player) => player.id === client.id),
      1
    )

    console.log(Game.players)

    client.broadcast.emit('lobby:player_left', deletedPlayer)

    if (deletedPlayer !== undefined && isHost(deletedPlayer.id)) {
      if (Object.keys(Game.players).length !== 0) {
        Game.host = Game.players[0]
        console.log(Game.players[0].username, 'is the new host')
        IOServer.emit('game:state', {
          state: 'new_host',
          host: Game.players[0],
        })
      }
    }
  })
})

connectToPort(server)
