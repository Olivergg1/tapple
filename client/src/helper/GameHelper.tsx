import { createStore } from 'solid-js/store'

// Defines the different states for a Game
export type GameState = 'running' | 'ended' | 'loading' | 'waiting'

// Player interface
export interface IPlayer {
  username: string
  avatar: string
  id: string
  isHost: boolean
}

// Game interface
interface IGame {
  game_state: GameState
  players: IPlayer[]
  setState: Function
  me?: IPlayer
  setMe: Function
  host?: IPlayer
  setHost: Function
}

export const isHost = (): boolean => {
  return game.me?.id === game.host?.id
}

const [game, setGame] = createStore<IGame>({
  game_state: 'waiting',
  players: [],
  me: undefined,
  setMe(player: IPlayer) {
    setGame('me', player)
  },
  setHost(host: IPlayer) {
    setGame('host', host)
  },
  setState(state: GameState) {
    setGame('game_state', state)
  },
})

// return game object
export const getGame = () => game

// set new game
const newGame = (players: IPlayer[]) => {
  setGame({
    game_state: 'waiting',
    players: players,
  })
}
