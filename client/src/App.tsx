import { Component, For, createSignal } from 'solid-js'

import styles from './App.module.css'
import { LetterStore, toggleLetter, resetLetters } from './helper/LetterHelper'
import { getSocketConnection } from './helper/SocketHelper'
import { addMessage, getMessages } from './helper/LogHelper'
getSocketConnection()?.connect()

interface LetterProps {
  letter: string
  id: number
  active: boolean
}

const [players, setPlayers] = createSignal<{ id: string } | {}>({})

const Letter: Component<LetterProps> = (props) => {
  const socket = getSocketConnection()
  const handleClick = (e: MouseEvent) => {
    toggleLetter(props.id ?? -1)
    socket?.emit('click:source', { id: props.id, letter: props.letter })
  }

  return (
    <button
      class={styles.button}
      classList={{ [styles.active]: props.active === true }}
      onClick={handleClick}>
      {props.letter}
    </button>
  )
}

const App: Component = () => {
  const [letters] = LetterStore

  const socket = getSocketConnection()

  socket?.on('connect', () => {
    let username = null
    while (username === null || username === '') {
      username = prompt('Namn:')
    }
    socket.emit('name:set', username)
  })

  socket?.on('lobby:players', (players) => {
    console.log(players)
    setPlayers(players)
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

  return (
    <div id={styles.App}>
      <div id={styles.content}>
        <div id={styles.log}>
          <div>
            <For each={getMessages()()}>{(message) => <p>{message}</p>}</For>
          </div>
          <div id={styles.players}>
            {/* <For each={Array.from(players())}>
              {([id, username]) => <p class={styles.player}>{player}</p>}
            </For> */}
          </div>
        </div>
        <div id={styles.board}>
          <div id={styles.letters}>
            <For each={letters} fallback={'horunge'}>
              {(letter) => (
                <Letter
                  active={letter.active}
                  letter={letter.letter}
                  id={letter.id}
                />
              )}
            </For>
          </div>
          <button id={styles.reset} onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
      {/* <For each={letters} fallback={'horunge'}>
        {(letter) => <p>{JSON.stringify(letter)}</p>}
      </For> */}
    </div>
  )
}

export default App
