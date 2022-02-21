import jwt from 'jsonwebtoken'
import users from '../models/users.js'

export default async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || ''
    if (token.length > 0) {
      const decoded = jwt.decode(token)
      if (!decoded) throw new Error('JWT 無法解析')
      req.user = await users.findOne({ _id: decoded._id, tokens: token }, '-password')
      req.token = token
      if (req.user) {
        jwt.verify(token, process.env.SECRET)
        next()
      } else {
        const error = new Error('JWT 已不存在')
        error.name = 'JWT_NOT_ESIST'
        throw error
      }
    } else {
      throw new Error('未傳入 JWT')
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError' && req.baseUrl === '/users' && req.path === '/extend') {
      next()
    } else if (error.name === 'JWT_NOT_ESIST') {
      res.status(400).send({ success: false, message: '請重新登入' })
    } else {
      res.status(401).send({ success: false, message: '驗證錯誤' })
    }
  }
}
