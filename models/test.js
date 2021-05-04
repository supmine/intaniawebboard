const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const testSchema = new Schema({
  body: {
    type: String,
    required: true,
  },
  //comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  likes: {
    type: Number,
    default: 0,
  }
}, { timestamps: true});

const Test = mongoose.model('Test', testSchema);
module.exports = Test;