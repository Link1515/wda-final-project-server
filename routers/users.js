import express from 'express'
import {
  login,
  register,
  extend,
  logout,
  editInfo,
  updateAvatar,
  editPassword,
  getUserBy,
  getInfo,
  addFavGame,
  removeFavGame
} from '../controllers/users.js'

// middleware
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'
import isAdmin from '../middleware/isAdmin.js'

const router = new express.Router()

router.post('/register', content('application/json'), register)
router.post('/login', login)
router.post('/extend', auth, extend)
router.get('/getInfo', auth, getInfo)
router.delete('/logout', auth, logout)

router.patch('/editInfo', auth, content('multipart/form-data'), upload, editInfo)
router.get('/updateAvatar', auth, updateAvatar)
router.patch('/editPassword', editPassword)
router.get('/getUserByAccount', auth, isAdmin, getUserBy('account'))
router.get('/getUserById', auth, isAdmin, getUserBy('_id'))

router.post('/addFavGame/:gameId', auth, addFavGame)
router.post('/removeFavGame/:gameId', auth, removeFavGame)

export default router
