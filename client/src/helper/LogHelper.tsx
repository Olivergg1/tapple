import { createSignal } from 'solid-js'

const [messages, setMessages] = createSignal<string[]>([])

export const addMessage = (message: string) => {
  setMessages((m) => [...m, message])
}

export const getMessages = () => messages
