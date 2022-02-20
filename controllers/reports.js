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

export const getReports = async (req, res) => {
  try {
    const result = await reports.find({})
    if (result.length > 0) {
      res.status(200).send({ success: true, message: '', result })
    } else {
      res.status(404).send({ success: false, message: '目前無錯誤回報' })
    }
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const deleteReport = async (req, res) => {
  try {
    await reports.findByIdAndDelete(req.params.id)
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}
