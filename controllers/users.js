import md5 from 'md5'
import jwt from 'jsonwebtoken'
import users from '../models/users.js'
import games from '../models/games.js'

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
    res.status(500).send({ success: false, message: '伺服器錯誤，登出失敗' })
  }
}

export const editInfo = async (req, res) => {
  try {
    req.user.account = req.body.account
    req.user.nickname = req.body.nickname
    if (req.file) {
      req.user.avatar = req.file.path
    }
    await req.user.save()
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = []
      for (const key in error.errors) {
        message.push(error.errors[key].message)
      }
      res.status(400).send({ success: false, message })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(400).send({ success: false, message: '帳號已存在' })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

export const updateAvatar = (req, res) => {
  res.status(200).send({ success: true, message: '', result: req.user.avatar })
}

export const editPassword = async (req, res) => {
  try {
    const user = await users.findOne({ account: req.body.account, password: md5(req.body.oldPassword) })
    if (user) {
      user.password = req.body.newPassword
      await user.save()
      res.status(200).send({ success: true, message: '' })
    } else {
      res.status(404).send({ success: true, message: '原密碼錯誤' })
    }
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const getUserBy = (type) => {
  return async (req, res) => {
    try {
      const result = await users.findOne({ [type]: req.query.searchStr }, '-password -favoriteGame -nickname -role -tokens')
      if (result) {
        res.status(200).send({ success: true, message: '', result })
      } else {
        res.status(404).send({ success: false, message: '查無用戶' })
      }
    } catch (error) {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

export const resetUserPassword = async (req, res) => {
  try {
    const user = await users.findById({ _id: req.body.userId })
    user.password = '0000'
    await user.save()
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const deleteUser = async (req, res) => {
  try {
    await users.findByIdAndDelete({ _id: req.params.id })
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const getInfo = async (req, res) => {
  try {
    const result = req.user.toObject()
    delete result.tokens
    res.status(200).send({ success: true, message: '獲取資訊成功', result })
  } catch (error) {
    res.status(500).send({ success: false, message: '取得資訊失敗，伺服器錯誤' })
  }
}

export const addFavGame = async (req, res) => {
  try {
    req.user.favoriteGame.push({ game: req.params.gameId, name: req.body.gameName })
    await req.user.save()
    await games.findByIdAndUpdate(req.params.gameId, { $inc: { likes: 1 } })
    res.status(200).send({ success: true, message: '', result: req.user.favoriteGame })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const removeFavGame = async (req, res) => {
  try {
    req.user.favoriteGame = req.user.favoriteGame.filter(fav => fav.game.toString() !== req.params.gameId.toString())
    await req.user.save()
    await games.findByIdAndUpdate(req.params.gameId, { $inc: { likes: -1 } })
    res.status(200).send({ success: true, message: '', result: req.user.favoriteGame })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const refreshFavGame = async (req, res) => {
  try {
    res.status(200).send({ success: true, message: '', result: req.user.favoriteGame })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}
