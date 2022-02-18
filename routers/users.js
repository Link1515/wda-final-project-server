import express from 'express'
import {
  login,
  register,
  extend,
  logout,
  editInfo,
  editpassword,
  getInfo,
  addFavGame,
  removeFavGame
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
router.patch('/editinfo', auth, editInfo)
router.patch('/editpassword', editpassword)
router.post('/addFavGame/:gameId', auth, addFavGame)
router.post('/removeFavGame/:gameId', auth, removeFavGame)

export default router
