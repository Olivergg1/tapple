import {
  Component,
  For,
  JSXElement,
  Match,
  Show,
  Switch,
  createSignal,
  onCleanup,
  createEffect,
} from 'solid-js'

import styles from './App.module.css'
import { LetterStore, toggleLetter, resetLetters } from './helper/LetterHelper'
import { getSocketConnection } from './helper/SocketHelper'
import { addMessage } from './helper/LogHelper'
import { IPlayer, getGame, isHost } from './helper/GameHelper'
import { createModal, ModalProvider } from './solid-media/solid-modal/dist/modal'
import { LoadingCircle } from './solid-media/solid-loading/dist/loading'
import { getSetting, getSettings, restoreSettings, TappleSetting, TappleSettingCategory } from './helper/SettingsHelper'

interface LetterProps {
  letter: string
  id: number
  active: boolean
  disabled: boolean
}

const [canClick, setCanClick] = createSignal(false)

// Clickable letter component
const Letter: Component<LetterProps> = (props) => {
  const socket = getSocketConnection()
  const handleClick = (e: MouseEvent) => {
    if (canClick() !== true) return
    setCanClick(false)
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

// Modal content for setting up a user
const SetupModalContent: Component<{ close: Function }> = (props) => {
  const [loading, setLoading] = createSignal(false)
  const [username, setUsername] = createSignal("")
  const socket = getSocketConnection()
  const game = getGame()

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    setLoading(true)

    // Send username to server
    socket?.emit('name:set', username())
    
    // Wait until server responds with user object
    socket?.on('me:init', (player: IPlayer) => {
      game.setMe(player)
      setLoading(false)
      props.close()
    })
  }

  return <form id={styles.example_form} onSubmit={handleSubmit}>
    <Show when={loading() === true}>
      <LoadingCircle />
    </Show>
    <input disabled={loading() === true} class={styles.modal_input} type="text" placeholder={"Username: "} onInput={(e) => setUsername(e.currentTarget.value)} />
    <button disabled={loading() === true || username() === ""} class={styles.modal_button} type="submit">Submit</button>
  </form>
}

interface SettingComponentProps {
  setting: TappleSetting
}

const Setting: Component<SettingComponentProps> = ({ setting }) => {
  return (
    <section class={styles.setting}>
      <label for={setting.key}>{capatilize(setting.key.split("_"))}</label>
      <input class={styles.modal_input} name={setting.key} type="text" value={setting.value as string} placeholder={setting.key + ":"} />
    </section>
  )
}

interface CategoryComponentProps {
  category: TappleSettingCategory
}

const capatilize = (input: string | string[]): string => {
  if (Array.isArray(input)) {
    // Calls the function recursivly inorder to build string
    const arrayOfStrings: string[] = []
    input.forEach(str => {
      arrayOfStrings.push(capatilize(str))
    })

    return arrayOfStrings.join(" ")
  }

  // Sets first char in string to uppercase and returns it
  return input[0].toUpperCase() + input.slice(1)
}

const Category: Component<CategoryComponentProps> = ({ category }) => {
  const [open, setOpen] = createSignal(false)

  const toggleOpen = () => {
    setOpen(o => !o)
  }

  return (
    <div class={styles.category}>
      <div class={styles.category_header} onClick={toggleOpen}>
        <h3>{capatilize(category.categoryName.split("_"))}</h3>
        <p class={styles.angle_icon} classList={{ [styles.down]: open() === true }}>&#8250;</p>
      </div>
      <div class={styles.settings} classList={{[styles.minimized]: open() !== true}}>
        <For each={category.settings}>
          { (setting) => <Setting setting={setting}/> }
        </For>  
      </div>
    </div> 
  )
}

// Modal content for setting up a user
const SettingsModalContent: Component<{ close: Function }> = (props) => {
  const settings = getSettings()

  return <div id={styles.settings_content}>
    <h1>Settings</h1>
    <For each={settings.categories}>
      { (category) => <Category category={category} />}
    </For>
    <button onClick={restoreSettings}>restore settings</button>
  </div>
}

const App: Component = () => {
  const [letters] = LetterStore
  const game = getGame()
  const socket = getSocketConnection()
  const debug = getSetting("developer", "developer_mode")

  const [showSetupModal, closeSetupModal] = createModal({ 
    title: "Welcome", 
    sizing: "default", 
    element: () => <SetupModalContent close={() => closeSetupModal()} />, 
    hideCloseButton: true, 
    centerTitle: true
  })

  const [showSettingsModal] = createModal({ 
    title: "Settings", 
    sizing: "maximize", 
    element: <SettingsModalContent close={() => closeSetupModal()} />,
    hideHeader: true,
    closeOnLostFocus: true
  })

  const ConnectingToServer: Component = () => {
    const loader = <LoadingCircle text="Connecting to server..." />
    const [currentContent, setCurrentContent] = createSignal(loader)
  
    const t = setTimeout(() => {
      if (socket?.connected === false) {
        setCurrentContent(
          <div id={styles.loading_settings}>
            <h3>Couldn't connect to the server</h3>
            { debug === true && (<>
                <p>If the problem persists, please consider changing the config</p>
                <button id={styles.loading_settings_button} onClick={showSettingsModal}>settings</button>
              </>)
            }
          </div>
        )
      }
    }, 5000)

    onCleanup(() => clearTimeout(t))
  
    return (
      <div id={styles.loading}>
        {currentContent}
      </div>
    )
  }

  // Show setup
  socket?.on('connect', () => {
    showSetupModal()
  })

  // Fires when a game state changes
  socket?.on('game:state', ({ state, ...other }) => {
    game.setState(state)
    switch (state) {
      case 'running':
        addMessage('Game started')
        resetLetters()
        break
      case 'ended':
        addMessage('Game ended')
        setCanClick(false)
        break
      case 'new_host':
        const new_host = other.host as IPlayer
        game.setHost(new_host)
        break
    }
  })

  // Fires when a lobby changes
  socket?.on('lobby:players', (players) => {
    console.log(players)
    game.setPlayers(players)
  })

  socket?.on('lobby:player_left', (deleted: IPlayer) => {
    game.removePlayer(deleted)
  })

  // Fires when a message is received
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

  socket?.on("disconnect", () => {
    window.location.reload()
    game.setState("connecting")
  })

  socket?.on("game:turn", (player: IPlayer) => {
    game.setTurn(player)
    if (game.turn?.id === game.me?.id) setCanClick(true)
  })

  const GAME_SETTINGS = {
    min_duration: 10000,
    max_duration: 20000,
  }

  // Starts the current game
  const startGame = () => {
    socket?.emit('game:start', {
      min: GAME_SETTINGS.min_duration,
      max: GAME_SETTINGS.max_duration,
    })
  }

  const PlayerCard: Component<{ player?: IPlayer; right?: JSXElement }> = ({
    right,
    player
  }) => {

    return (
      <div class={styles.playerCard} classList={{ [styles.highlight]: player?.id === game.turn?.id }}>
        <h3>{player?.avatar}</h3>
        <h3 class={styles.username}>{player?.username}</h3>
        <span class={styles.right}>{right}</span>
      </div>
    )
  }

  const DebugWindow: Component = (props) => {
    return (
      <Show when={debug === true}>
        <div id={styles.debug}>
          <div>
            
              <h3 style={{ "padding-bottom": "0.8rem" }}>Debug mode</h3>
              <p>State: {game.game_state || "---"}</p>
              <p>Me: {game?.me?.username || "---"}</p>
              <p>My id: {game.me?.id || "---"}</p>
              <p>Host: {game.host?.username || "---"}</p>
              <p>Players: {game.players.length}</p>
              <p>Turn: {game.turn?.username}</p>
              <p>canClick: {canClick() ? "yes" : "no" }</p>
            
          </div>
        </div>
      </Show>
    )
  }

  const isPlayersTurn = (id: string) => {
    return game.turn?.id === id
  }

  return (
    <div id={styles.App}>
      <ModalProvider>
        <DebugWindow />
        <Show when={game.me} fallback={<ConnectingToServer />}>
          <div id={styles.content}>
            <div id={styles.left}>
              <div id={styles.players}>
                <h2>Players</h2>
                <For each={game.players}>
                  {(player) => <PlayerCard player={player} />}
                </For>
              </div>
              {/*<Show when={game.me}>
                <PlayerCard
                  player={game.me}
                  right={
                    <button id={styles.settings} onClick={showSettingsModal}>
                      ⚙️
                    </button>
                  }
                />
              </Show>*/}
            </div>
            <div id={styles.board}>
              <div id={styles.letters}>
                <For each={letters} fallback={'horunge'}>
                  {(letter) => (
                    <Letter
                      disabled={game.game_state !== 'running' || canClick() === false }
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
        </Show>
      </ModalProvider>
    </div>
  )
}

export default App
