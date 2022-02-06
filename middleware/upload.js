import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

cloudinary.config({
  cloud_name: process.env.CCLOUDINARY_NAME,
  api_key: process.env.CCLOUDINARY_KEY,
  api_secret: process.env.CCLOUDINARY_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'e-tableTopGame'
  }
})

const upload = multer({
  storage,
  fileFilter (req, file, cb) {
    if (!file.mimetype.includes('image')) {
      cb(new multer.MulterError('LIMIT_FORMAT'), false)
    } else {
      cb(null, true)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

export default async (req, res, next) => {
  upload.single('image')(req, res, error => {
    if (error instanceof multer.MulterError) {
      let message = '上傳錯誤'
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '檔案太大'
      } else if (error.code === 'LIMIT_FORMAT') {
        message = '檔案格式錯誤'
      }
      res.ststus(400).send({ success: false, message })
    } else if (error) {
      res.ststus(500).send({ success: false, message: '伺服器錯誤' })
    } else {
      next()
    }
  })
}
