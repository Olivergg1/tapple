import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'

import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  OK,
  UNAUTHORIZED,
} from '../../config/statusCode'
import MUser from '../../schemas/User.schema'
import { TOOKEN_EXPIRE, generateAccessToken } from '../../middlewares/authorize'

export const login = async (req: Request, res: Response) => {
  console.log('>> Authentication begun')

  try {
    const { password, username } = req.body
    const user = await MUser.findOne({ username: username })

    if (user === null) {
      throw 'Bad request'
    }

    const isPasswordOK = await bcrypt.compare(password, user.password || '')
    if (isPasswordOK === false) {
      throw 'Bad request'
    }

    const token = generateAccessToken({ id: user.id })

    res.cookie('tok', token, {
      maxAge: TOOKEN_EXPIRE * 1000, // Seconds to milliseconds
      httpOnly: true,
      secure: true, // Change when https is used
    })

    console.log('+ Authentication successfull')
    res.status(OK).json('OK')
  } catch (err) {
    //console.log(err)
    console.log('- Authentication failed')
    res
      .status(BAD_REQUEST)
      .json({ message: 'Invalid username or password', stack: err })
  }
}

export const auth = async (req: Request, res: Response) => {
  console.log('Autheticated')
  res.status(OK).json(req.user)
}

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('tok')
  res.status(OK).send('success')
}
