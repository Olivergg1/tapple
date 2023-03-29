import { randomUUID } from 'crypto'
import client from '../config/databaseConfig'

const userSchema = new client.Schema({
  username: { type: String, unique: true, index: true },
  name: String,
  password: { type: String, required: true },
  avatar: String,
})

const MUser = client.model('User', userSchema)

export default MUser
