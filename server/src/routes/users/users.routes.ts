import express from 'express'
import { deleteUser, getUser, registerUser } from './users.controller'
import { authenticated } from '../../middlewares/authorize'

const router = express.Router()

// User routes
router.get('/', getUser)
// router.get('/:id', getUser)
router.post('/register', registerUser)

router.delete('/delete', authenticated, deleteUser)

export default router
