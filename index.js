import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'

mongoose.connect(process.env.DB_URL, () => {
  console.log('MongoDB Connected')
})

const app = express()
