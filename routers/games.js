import express from 'express'
import {
  create
} from '../controllers/games.js'

import auth from '../middleware/auth.js'

const Router = new express.Router()

Router.post('/create', auth, create)

export default Router
