import { Express } from 'express'
import { Server } from 'http'

export const connectToPort = (app: Server) => {
  const port = process.env.PORT || 8080
  app.listen(port, () => console.log(`Listening on port ${port}`))
}
