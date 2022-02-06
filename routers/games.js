import express from 'express'
import {
  create
} from '../controllers/games.js'

import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const Router = new express.Router()

Router.post('/create', auth, upload, create)

export default Router
