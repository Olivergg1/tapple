import client from 'mongoose'

client.set('strictQuery', false)

client.connection.on('error', (err) => {
  console.log('ERR: Connection failed')
})

client.connection.on('connected', () => {
  console.log('Connected')
})

export const connect = async () => {
  const connection_url = process.env.DATABASE_URL || 'no_url'
  console.log('Connecting to database... ')
  await client.connect(connection_url)
}

export default client
