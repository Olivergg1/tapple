import express from 'express'
import { login, auth, logout } from './auth.controller'
import { authenticated } from '../../middlewares/authorize'

const router = express.Router()

// Auth routes
router.get('/', authenticated, auth)
router.post('/logout', authenticated, logout)
router.post('/login', login)

export default router
