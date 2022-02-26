import games from '../models/games.js'
import users from '../models/users.js'

export const getGames = async (req, res) => {
  try {
    const result = await games.find({}, 'name image likes').sort({ likes: -1 }).limit(5).skip(5 * (req.query.page - 1))
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const create = async (req, res) => {
  try {
    for (const key in req.body) {
      if (key.includes('List') || key === 'playerRange') {
        req.body[key] = JSON.parse(req.body[key])
      }
    }
    await games.create({ ...req.body, author: req.user._id, image: req.file?.path })
    res.status(200).send({ success: true, message: '成功創建桌遊' })
  } catch (error) {
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

export const getUserMadeGames = async (req, res) => {
  try {
    const result = await games.find({ author: req.user._id }, 'name image').sort({ _id: -1 }).limit(10).skip(10 * (req.query.page - 1))
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    res.status(500).send({ success: true, message: '伺服器錯誤' })
  }
}

export const getGameById = async (req, res) => {
  try {
    const result = await games.findById(req.params.id)
    if (result) {
      res.status(200).send({ success: true, message: '', result })
    } else {
      res.status(404).send({ success: true, message: '找不到桌遊' })
    }
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(404).send({ success: true, message: '找不到桌遊' })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

export const getGameByName = async (req, res) => {
  try {
    const searchText = new RegExp(req.params.searchText)
    const result = await games.find({ name: searchText })
    if (result.length > 0) {
      res.status(200).send({ success: true, message: '', result })
    } else {
      res.status(404).send({ success: false, message: '找不到符合的桌遊' })
    }
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const updateOneGame = async (req, res) => {
  try {
    const game = await games.findById(req.body._id)
    if (game.author.toString() !== req.user._id.toString()) throw new Error('author edit only')

    for (const key in req.body) {
      if (key.includes('List') || key === 'playerRange') {
        req.body[key] = JSON.parse(req.body[key])
      }
    }

    if (req.file) {
      req.body.image = req.file.path
    }

    await games.findByIdAndUpdate(req.body._id, req.body, { runValidators: true })

    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    if (error.message === 'author edit only') {
      res.status(400).send({ success: false, message: '只有作者可以修改' })
    }
  }
}

export const deleteGameById = async (req, res) => {
  try {
    await games.findByIdAndDelete(req.params.id)
    await users.updateMany({ 'favoriteGame.game': req.params.id },
      {
        $pull: {
          favoriteGame: { game: req.params.id }
        }
      })
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    res.status(404).send({ success: false, message: '找不到桌遊' })
  }
}
