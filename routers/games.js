import express from 'express'
import {
  getGames,
  create,
  getUserMadeGames,
  getGameById,
  updateOneGame,
  deleteGameById
} from '../controllers/games.js'

import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'
import isAdmin from '../middleware/isAdmin.js'

const Router = new express.Router()

Router.get('/', getGames)
Router.post('/create', content('multipart/form-data'), auth, upload, create)
Router.get('/getUserMadeGames', auth, getUserMadeGames)
Router.get('/getGameById/:id', getGameById)
Router.patch('/update', content('multipart/form-data'), auth, upload, updateOneGame)
Router.delete('/deleteGameById/:id', auth, isAdmin, deleteGameById)

export default Router
