import { IUser } from '../../src'

declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}
