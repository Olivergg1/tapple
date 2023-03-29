import { NextFunction, Request, Response } from 'express'
import { FORBIDDEN, UNAUTHORIZED } from '../config/statusCode'
import jwt from 'jsonwebtoken'
import MUser from '../schemas/User.schema'
import { IUser } from '..'

export const TOOKEN_EXPIRE = 86400 // time in seconds

export const generateAccessToken = (user: { id: String }) => {
  return jwt.sign(user, process.env.TOKEN_SECRET!, {
    expiresIn: TOOKEN_EXPIRE,
  })
}

export const authenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.tok || null // Retrieve token from client-cookies

  if (token == null) return res.status(UNAUTHORIZED).send('Unauthorized')

  // Validate and verify given token
  jwt.verify(token, process.env.TOKEN_SECRET!, async (err: any, user: any) => {
    if (err) return res.status(FORBIDDEN).send('Forbidden')
    req.user = (await MUser.findById(user.id)) as IUser
    next()
  })
}
