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
  resetUserPassword,
  deleteUser,
  getInfo,
  addFavGame,
  removeFavGame,
  refreshFavGame
} from '../controllers/users.js'

// middleware
import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'
import isAdmin from '../middleware/isAdmin.js'

const Router = new express.Router()

Router.post('/register', content('application/json'), register)
Router.post('/login', login)
Router.post('/extend', auth, extend)
Router.get('/getInfo', auth, getInfo)
Router.delete('/logout', auth, logout)

Router.patch('/editInfo', auth, content('multipart/form-data'), upload, editInfo)
Router.get('/updateAvatar', auth, updateAvatar)
Router.patch('/editPassword', editPassword)

Router.get('/getUserByAccount', auth, isAdmin, getUserBy('account'))
Router.get('/getUserById', auth, isAdmin, getUserBy('_id'))
Router.patch('/resetUserPassword', auth, isAdmin, resetUserPassword)
Router.delete('/deleteUser/:id', auth, isAdmin, deleteUser)

Router.post('/addFavGame/:gameId', auth, addFavGame)
Router.post('/removeFavGame/:gameId', auth, removeFavGame)
Router.get('/refreshFavGame', auth, refreshFavGame)

export default Router
