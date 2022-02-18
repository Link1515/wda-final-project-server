import express from 'express'
import auth from '../middleware/auth.js'
import { createReport } from '../controllers/reports.js'

const Router = express.Router()

Router.post('/createReport', auth, createReport)

export default Router
