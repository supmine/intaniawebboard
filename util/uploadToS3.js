const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
var path = require('path');
require('dotenv/config');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
}); 

async function uploadToS3(file) {
    const fileType = path.extname(file.originalname);
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuidv4()}.${fileType}`,
        Body: file.buffer,
        ACL: "public-read"
    };
    return s3.upload(params).promise() //return data / throw error
}
module.exports = uploadToS3;