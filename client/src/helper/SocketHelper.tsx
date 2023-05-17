import io from 'socket.io-client'
import { createResource } from 'solid-js'
import { getSetting, initalizeSettings } from './SettingsHelper'

const protocol =() => getSetting("network", "protocol")
const url = () => getSetting("network", "server")
const port = () => getSetting("network", "port") as number

// Function for connecting to websocket server
const connect = () => {
  // Load settings
  initalizeSettings()
  return io(`${protocol()}://${url()}:${port()}`)
}

const [connection] = createResource(connect)

export default connection

export const getSocketConnection = () => connection()
