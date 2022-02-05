import mongoose from 'mongoose'

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '桌遊名稱不能為空']
  },
  author: {
    type: mongoose.ObjectId,
    required: [true, '作者不能為空']
  },
  description: String,
  playerRange: [Number],
  goodCompRoleList: Array,
  badCompRoleList: Array,
  enableFunRole: Boolean,
  funRoleList: Array,
  stepList: Array,
  voiceType: {
    type: String,
    default: 'Google 國語'
  }
}, { versionKey: false })

export default mongoose.model('games', gameSchema)
