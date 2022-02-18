import reports from '../models/reports.js'

export const createReport = async (req, res) => {
  try {
    await reports.create({ ...req.body, userId: req.user._id })
    res.status(200).send({ success: true, message: '' })
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
