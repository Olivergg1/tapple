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
  setPlayers: Function,
  addPlayer: Function,
  removePlayer: Function
  setState: Function
  me?: IPlayer
  setMe: Function
  host?: IPlayer
  setHost: Function,
  turn?: IPlayer,
  setTurn: Function
}

export const isHost = (): boolean => {
  return game.me?.id === game.host?.id
}

const [game, setGame] = createStore<IGame>({
  game_state: 'waiting',
  players: [],
  me: undefined,
  turn: undefined,
  setMe(player: IPlayer) {
    setGame('me', player)
  },
  setHost(host: IPlayer) {
    setGame('host', host)
  },
  setState(state: GameState) {
    setGame('game_state', state)
  },
  setPlayers(players: IPlayer[]){
    setGame("players", players)
  },
  addPlayer(player: IPlayer){
    setGame("players", (ps) => [...ps, player])
  },
  removePlayer(deleted: IPlayer){
    const players_temp = this.players.filter((player) => player.id !== deleted.id)
    setGame("players", (players_temp))
  },
  setTurn(player: IPlayer) {
    setGame("turn", player)
  }
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
