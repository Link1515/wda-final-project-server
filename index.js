import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'

// router
import userRouter from './routers/users.js'

mongoose.connect(process.env.DB_URL, () => {
  console.log('MongoDB Connected')
})

const app = express()

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

app.use('/users', userRouter)

app.all('*', (req, res) => {
  console.error(`${req.method} 方法沒有匹配的路徑 ${req.originalUrl}`)
  res.status(404).send({ success: false, message: '找不到' })
})

app.listen(process.env.PORT || 3001, () => {
  console.log('server is running')
})
