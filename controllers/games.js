import games from '../models/games.js'

export async function create (req, res) {
  try {
    console.log(req.body)
    for (const key in req.body) {
      if (key.includes('List') || key === 'playerRange') {
        req.body[key] = JSON.parse(req.body[key])
      }
    }
    await games.create({ ...req.body, author: req.user._id, image: req.file?.path })
    res.status(200).send({ success: true, message: '成功創建桌遊' })
  } catch (error) {
    console.log(error)
    if (error.name === 'ValidationError') {
      const message = []
      for (const key in error.errors) {
        message.push(error.errors[key].message)
      }
      res.status(400).send({ success: false, message })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}
