import multer from 'multer';
import path from 'path';

const __dirname = path.resolve();

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, __dirname + `/frontend/public/images`);
    },
    filename: (req, file, callback) => {
        const name = Date.now() + '-' + file.originalname;
        callback(null, name);
    }
});

const imgUpload = multer({ storage });

export default imgUpload;