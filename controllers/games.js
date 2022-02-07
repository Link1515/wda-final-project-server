import games from '../models/games.js'

export async function getGames (req, res) {
  try {
    const result = await games.find({}).sort({ _id: -1 }).limit(10).skip(10 * (req.query.page - 1))
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
  }
}

export async function create (req, res) {
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

export async function getUserMadeGames (req, res) {
  try {
    const result = await games.find({ author: req.user._id }, 'name image')
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    res.status(500).send({ success: true, message: '伺服器錯誤' })
  }
}

export async function getOneGame (req, res) {
  try {
    const result = await games.findOne({ _id: req.body.gameId })
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export async function updateOneGame (req, res) {
  try {
    const game = await games.findById(req.body._id)
    if (game.author.toString() !== req.user._id.toString()) throw new Error('author edit only')

    for (const key in req.body) {
      if (key.includes('List') || key === 'playerRange') {
        req.body[key] = JSON.parse(req.body[key])
      }
    }

    if (!req.body.image) {
      delete req.body.image
    }

    await games.findByIdAndUpdate(req.body._id, req.body, { runValidators: true })

    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    console.log(error)
    if (error.message === 'author edit only') {
      res.status(400).send({ success: false, message: '只有作者可以修改' })
    }
  }
}
