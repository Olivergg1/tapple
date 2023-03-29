import { Request, Response } from 'express'
import MUser from '../../schemas/User.schema'

import bcrypt from 'bcryptjs'
import { BAD_REQUEST, OK } from '../../config/statusCode'

// Get user, indexed by username
export const getUser = async (req: Request, res: Response) => {}

// Register a new user
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, name, password } = req.body
    const encryptedPassword = await bcrypt.hash(password, 15)
    const user = new MUser({
      username: username,
      name,
      password: encryptedPassword,
      avatar: '🍊',
    })
    await user.save()

    res.status(OK).json({ message: 'User created' })
  } catch (err) {
    res.status(BAD_REQUEST).json({ message: 'Failed to create user' })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.user?._id
    const user = await MUser.findByIdAndDelete(id)

    console.log('deleted', user?.id)

    res.status(OK).send({ message: 'Successfully deleted user' })
  } catch (error) {
    res.status(BAD_REQUEST).send('failed to delete user')
  }
}
