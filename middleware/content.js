export default (contentType) => {
  return (req, res, next) => {
    if (!req.headers['content-type']) {
      res.status(400).send({ success: false, message: '未傳遞資料，請求頭沒有 content-type' })
    } else if (!req.headers['content-type'].includes(contentType)) {
      res.status(400).send({ success: false, message: `資料格式不正確，必須為 ${contentType}` })
    } else {
      next()
    }
  }
}
