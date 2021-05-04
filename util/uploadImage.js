const multer = require('multer');

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif'){
      cb(null, true); //accept file
  } else {
      cb(new Error('Accept only .jpg .jpeg .png .gif files'), false); //reject file
  }
}
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage, 
  limits:  {
      fileSize: 1024 * 1024 * 4 //2MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;