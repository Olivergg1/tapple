import io from 'socket.io-client'
import { createResource } from 'solid-js'

const connect = () => io('http://192.168.1.200:8080')

const [connection] = createResource(connect)

export const getSocketConnection = () => connection()
