import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { Server } from 'socket.io'
import { createServer } from 'http'
import socketfun from './socketControllers/socket.js'

// express router
import userRouter from './routers/users.js'
import gameRouter from './routers/games.js'
import reportRouter from './routers/reports.js'

mongoose.connect(process.env.DB_URL, () => {
  console.log('MongoDB Connected')
})

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin (origin, callback) {
      if (origin === undefined || origin.includes('github') || origin.includes('localhost')) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true
  },
  allowEIO3: true
})

io.on('connection', socketfun(io))

app.use(cors({
  origin (origin, callback) {
    if (origin === undefined || origin.includes('github') || origin.includes('localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'), false)
    }
  }
}))
app.use((_, req, res, next) => {
  res.status(403).send({ success: false, message: 'Not allowed by CORS' })
})

app.use(express.json())
app.use((_, req, res, next) => {
  res.status(400).send({ success: false, message: '格式錯誤' })
})

app.get('/checkServer', (req, res) => {
  res.status(200).send({ success: true, message: '', result: { serverOn: true } })
})

app.use('/users', userRouter)
app.use('/games', gameRouter)
app.use('/reports', reportRouter)

app.all('*', (req, res) => {
  console.error(`${req.method} 方法沒有匹配的路徑 ${req.originalUrl}`)
  res.status(404).send({ success: false, message: '找不到' })
})

httpServer.listen(process.env.PORT || 3001, () => {
  console.log('server is running')
})
