import express from 'express'
import {
  login,
  register,
  extend,
  logout,
  getInfo
} from '../controllers/users.js'

// middleware
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'

const router = new express.Router()

router.post('/register', content('application/json'), register)
router.post('/login', login)
router.post('/extend', auth, extend)
router.get('/getInfo', auth, getInfo)
router.delete('/logout', auth, logout)

export default router
