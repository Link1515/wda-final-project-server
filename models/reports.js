import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.ObjectId,
    required: [true, '必須有用戶 ID']
  },
  title: {
    type: String,
    required: [true, '必須填寫標題']
  },
  text: {
    type: String,
    required: [true, '必須填寫內容']
  }
}, { versionKey: false })

export default mongoose.model('reports', reportSchema)
