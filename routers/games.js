import express from 'express'
import {
  create,
  getUserMadeGames,
  getOneGame,
  updateOneGame
} from '../controllers/games.js'

import content from '../middleware/content.js'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const Router = new express.Router()

Router.post('/create', content('multipart/form-data'), auth, upload, create)
Router.get('/getUserMadeGames', auth, getUserMadeGames)
Router.post('/getOneGame', auth, getOneGame)
Router.patch('/update/:id', content('multipart/form-data'), auth, upload, updateOneGame)

export default Router
