import mongoose from 'mongoose'
import validator from 'validator'
import md5 from 'md5'

const userSchema = new mongoose.Schema({
  account: {
    type: String,
    required: [true, '帳號不能為空'],
    unique: true,
    minlength: [4, '帳號必須 4 個字以上'],
    maxlength: [20, '帳號必須 20 個字以下']
  },
  password: {
    type: String,
    required: [true, '密碼不能為空'],
    minlength: [4, '密碼必須 4 個字以上'],
    maxlength: [20, '密碼必須 20 個字以下']
  },
  email: {
    type: String,
    required: [true, '信箱不得為空'],
    unique: true,
    validate: {
      validator (value) {
        return validator.isEmail(value)
      },
      message: '信箱格式不正確'
    }
  },
  role: {
    type: String,
    default: 'user'
  },
  tokens: [String],
  favoriteGame: {
    type: [
      {
        game: {
          type: mongoose.ObjectId,
          ref: 'game',
          required: [true, '缺少 game id']
        },
        name: String
      }
    ]
  }
}, { versionKey: false })

userSchema.pre('save', function (next) {
  const user = this
  if (user.isModified('password')) {
    if (user.password.length < 4) {
      const error = new mongoose.Error.ValidationError(null)
      error.addError('password', new mongoose.Error.ValidatorError({ message: '密碼必須 4 個字以上' }))
      next(error)
      return
    } else if (user.password.length > 20) {
      const error = new mongoose.Error.ValidationError(null)
      error.addError('password', new mongoose.Error.ValidatorError({ message: '密碼必須 20 個字以下' }))
      next(error)
      return
    } else {
      user.password = md5(user.password)
    }
  }
  next()
})

userSchema.pre('findOneAndUpdate', function (next) {
  const user = this._update
  if (user.isModified('password')) {
    if (user.password.length < 4) {
      const error = new mongoose.Error.ValidationError(null)
      error.addError('password', new mongoose.Error.ValidatorError({ message: '密碼必須 4 個字以上' }))
      next(error)
      return
    } else if (user.password.length > 20) {
      const error = new mongoose.Error.ValidationError(null)
      error.addError('password', new mongoose.Error.ValidatorError({ message: '密碼必須 20 個字以下' }))
      next(error)
      return
    } else {
      user.password = md5(user.password)
    }
  }
  next()
})

export default mongoose.model('users', userSchema)
