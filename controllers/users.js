import md5 from 'md5'
import jwt from 'jsonwebtoken'
import users from '../models/users.js'

export const register = async (req, res) => {
  try {
    await users.create({
      account: req.body.account,
      password: req.body.password,
      email: req.body.email
    })
    res.status(200).send({ success: true, message: '註冊成功' })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = []
      for (const key in error.errors) {
        message.push(error.errors[key].message)
      }
      res.status(400).send({ success: false, message })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      if (/account/.test(error.message)) {
        res.status(400).send({ success: false, message: '帳號已存在' })
      } else if (/email/.test(error.message)) {
        res.status(400).send({ success: false, message: '電子信箱已存在' })
      } else {
        res.status(500).send({ success: false, message: '未定義的資訊重複錯誤' })
      }
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

export const login = async (req, res) => {
  try {
    const user = await users.findOne({ account: req.body.account, password: md5(req.body.password) }, '-password')
    if (user) {
      const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET, { expiresIn: '7 days' })
      user.tokens.push(token)
      await user.save()
      // 只留當前 token 回復給 client
      const result = user.toObject()
      delete result.tokens
      result.token = token
      res.status(200).send({ success: true, message: '', result })
    } else {
      res.status(404).send({ success: false, message: '帳號或密碼錯誤' })
    }
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const extend = async (req, res) => {
  try {
    const tokenIndex = req.user.tokens.findIndex(token => token === req.token)
    const newToken = jwt.sign({ _id: req.user._id }, process.env.SECRET, { expiresIn: '7 days' })
    req.user.tokens[tokenIndex] = newToken
    await req.user.save()
    res.status(200).send({ success: true, message: '延長 JWT 成功', result: { newToken } })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤，延長 JWT 失敗' })
  }
}

export const logout = async (req, res) => {
  try {
    const tokenIndex = req.user.tokens.findIndex(token => token === req.token)
    req.user.tokens.splice(tokenIndex, 1)
    req.user.save()
    res.status(200).send({ success: true, message: '登出成功' })
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: '伺服器錯誤，登出失敗' })
  }
}
