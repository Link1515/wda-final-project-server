export default (req, res, next) => {
  if (!req.user.role === 'admin') {
    res.status(403).send({ success: false, message: '非管理員' })
    return
  }
  next()
}
