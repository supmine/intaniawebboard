const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const topicSchema = new Schema({
  body: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId, ref: 'User', 
    required: true,
  },
  imageUrl: {
    type: String
  },
  likes: {
    type: Number,
    default: 0,
  }
}, { timestamps: true});

const Topic = mongoose.model('Topic', topicSchema);
module.exports = Topic;