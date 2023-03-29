import { createStore } from 'solid-js/store'
import { getSocketConnection } from './SocketHelper'

const letters =
  'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,Å,Ä,Ö'.split(',')

const generateLettersArray = () => {
  return letters.map((letter, i) => {
    return {
      letter: letter,
      id: i,
      active: false,
    }
  })
}

export const LetterStore = createStore(generateLettersArray())

export const toggleLetter = (index: number) => {
  const socket = getSocketConnection()
  if (index === -1) return console.error('Bad index')
  if (socket?.connected === false) return console.error('not connected')
  const [, setLetter] = LetterStore

  setLetter(
    (letter) => letter.id === index,
    'active',
    (active) => !active
  )
}

export const resetLetters = () => {
  LetterStore[1](generateLettersArray())
}
