const multer = require('multer')


const upload = multer(
    {
        //for temporary storage
        storage:multer.memoryStorage(),
        limits:{
            fileSize :3 *1024 *1024 //at max 3MB PDF
        }
    }
)

module.exports = upload;