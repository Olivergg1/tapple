import { Request, Response } from 'express'

export const notFound = (req: Request, res: Response, next: Function) => {
  const error = new Error(`Not Found! ${req.originalUrl}`)
  res.status(404)
  next(error)
}

export const errorHandler = (
  error: { message: string; stack: string },
  req: Request,
  res: Response,
  next: Function
) => {
  const statuscode = res.statusCode == 200 ? 500 : res.statusCode
  res.status(statuscode)
  res.json({
    statuscode: statuscode,
    message: error.message,
    stacktrace: error.stack,
  })
}
