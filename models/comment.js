const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  body: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId, ref: 'User',
    required: true,
  },
  topic: { 
    type: Schema.Types.ObjectId, ref: 'Topic',
    required: true
  },
  imageUrl: {
    type: String
  },
  // likes: {
  //   type: Number,
  //   default: 0,
  // }
}, {timestamps: true});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;