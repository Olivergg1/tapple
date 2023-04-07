import {
  Component,
  For,
  JSXElement,
  Match,
  Show,
  Switch,
  createSignal,
} from 'solid-js'

import styles from './App.module.css'
import { LetterStore, toggleLetter, resetLetters } from './helper/LetterHelper'
import { getSocketConnection } from './helper/SocketHelper'
import { addMessage } from './helper/LogHelper'
import { IPlayer, getGame, isHost } from './helper/GameHelper'
getSocketConnection()?.connect()

interface LetterProps {
  letter: string
  id: number
  active: boolean
  disabled: boolean
}

const [players, setPlayers] = createSignal<IPlayer[]>([])
const [debug, setDebug] = createSignal<boolean>(false)

const Letter: Component<LetterProps> = (props) => {
  const socket = getSocketConnection()
  const handleClick = (e: MouseEvent) => {
    toggleLetter(props.id ?? -1)
    socket?.emit('click:source', { id: props.id, letter: props.letter })
  }

  return (
    <button
      disabled={props.disabled}
      class={styles.button}
      classList={{ [styles.active]: props.active === true }}
      onClick={handleClick}>
      {props.letter}
    </button>
  )
}

const App: Component = () => {
  const [letters] = LetterStore
  const game = getGame()

  const socket = getSocketConnection()

  socket?.on('connect', () => {
    let username = null
    while (username === null || username === '') {
      username = prompt('Namn:')
    }
    socket.emit('name:set', username)
  })

  socket?.on('me:init', (player: IPlayer) => {
    game.setMe(player)
    console.log('me:', player)
  })

  socket?.on('game:state', ({ state, ...other }) => {
    game.setState(state)
    switch (state) {
      case 'running':
        addMessage('Game started')
        console.log('Game started')
        resetLetters()
        break
      case 'ended':
        addMessage('Game ended')
        console.log('Game ended')
        break
      case 'new_host':
        const new_host = other.host as IPlayer
        game.setHost(new_host)
        break
    }
  })

  socket?.on('lobby:players', (players) => {
    console.log(players)
    setPlayers(players)
  })

  socket?.on('lobby:player_left', (deleted: IPlayer) => {
    const players_temp = players().filter((player) => player.id === deleted.id)
    setPlayers(players_temp)
  })

  socket?.on('message', (msg) => {
    addMessage(msg)
  })

  socket?.on('click:target', (msg) => {
    const { id } = msg
    toggleLetter(id)
  })

  socket?.on('reset:target', () => {
    resetLetters()
  })

  const handleReset = () => {
    resetLetters()
    socket?.emit('reset:source')
  }

  const GAME_SETTINGS = {
    min_duration: 10000,
    max_duration: 20000,
  }

  const startGame = () => {
    handleReset()
    socket?.emit('game:start', {
      min: GAME_SETTINGS.min_duration,
      max: GAME_SETTINGS.max_duration,
    })
  }

  const PlayerCard: Component<{ player?: IPlayer; right?: JSXElement }> = ({
    right,
    player,
  }) => {
    console.log(player, 123123123)
    return (
      <div class={styles.playerCard}>
        <h3>{player?.avatar}</h3>
        <h3 class={styles.username}>{player?.username}</h3>
        <span class={styles.right}>{right}</span>
      </div>
    )
  }

  const toggleDebugMode = () => {
    setDebug((v) => !v)
  }

  const toggleSettings = () => {
    alert('Should show settings menu')
  }

  const DebugWindow: Component = (props) => {
    return (
      <div id={styles.debug}>
        <button onClick={toggleDebugMode}>
          {debug() === true ? 'hide' : 'debug'}
        </button>
        <div>
          <Show when={debug() === true}>
            <p>State: {game.game_state}</p>
            <p>Me: {game?.me?.username}</p>
            <p>Host: {game.host?.username}</p>
          </Show>
        </div>
      </div>
    )
  }

  return (
    <div id={styles.App}>
      <DebugWindow />
      <div id={styles.content}>
        <div id={styles.left}>
          <div id={styles.players}>
            <h2>Players</h2>
            <For each={players()}>
              {(player) => <PlayerCard player={player} />}
            </For>
          </div>
          <Show when={game.me}>
            <PlayerCard
              player={game.me}
              right={
                <button id={styles.settings} onClick={toggleSettings}>
                  ⚙️
                </button>
              }
            />
          </Show>
        </div>
        <div id={styles.board}>
          <div id={styles.letters}>
            <For each={letters} fallback={'horunge'}>
              {(letter) => (
                <Letter
                  disabled={game.game_state !== 'running'}
                  active={letter.active}
                  letter={letter.letter}
                  id={letter.id}
                />
              )}
            </For>
          </div>
          <Switch>
            <Match when={game.game_state === 'ended'}>
              <h3>Game over!</h3>
            </Match>
            <Match when={game.game_state !== 'running' && isHost() === false}>
              <h3>Waiting for host to start game</h3>
            </Match>
            <Match when={game.game_state !== 'running' && isHost() === true}>
              <h3>You're the host</h3>
              <Show when={game.game_state !== 'running'}>
                <button id={styles.start} onClick={startGame}>
                  Start
                </button>
              </Show>
            </Match>
          </Switch>
        </div>
        <div id={styles.right}></div>
      </div>
    </div>
  )
}

export default App
