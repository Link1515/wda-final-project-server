import express from 'express'
import { createReport, getReports, deleteReport } from '../controllers/reports.js'
import auth from '../middleware/auth.js'
import isAdmin from '../middleware/isAdmin.js'

const Router = express.Router()

Router.post('/createReport', auth, createReport)
Router.get('/getReports', auth, isAdmin, getReports)
Router.delete('/deleteReport/:id', auth, isAdmin, deleteReport)

export default Router
