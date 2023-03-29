import MUser from './schemas/User.schema'

export interface Group {
  id: string
  name: string
  assignments?: Assignment[]
  ownerId: string
  owner?: User
  members?: User[]
}

export interface Assignment {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  creatorId: string
  user?: User
  group?: Group
}

export interface IUser {
  _id: string
  name: string
  password: string
  username: string
}
