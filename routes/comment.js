const express = require('express');
const Topic = require('../models/topic');
const Comment = require('../models/comment');

const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (req.user) {
        console.log('authenticated');
        return next();
    } else {
        console.log('not authenticated')
            //res.redirect('/login');
        res.status(401).json({
            message: "user not authenticated"
        })
    }
};

//edit comment **expects newBody in req.body**
// tested only with dummy userIds
router.patch('/:commentId', isAuthenticated, (req, res, next) => {
    const id = req.params.commentId;
    const userId = req.user._id;
    Comment.updateOne({ _id: id, author: userId }, { $set: { body: req.body.newBody } })
        .exec()
        .then(result => {
            console.log(result);
            if (result.nModified === 1) {
                res.status(200).json({
                    message: 'Comment edited',
                    // request: {
                    //     type: 'GET',
                    //     url: 'http://localhost:4000/topics/' + id
                    // }
                });
            } else {
                res.status(405).json({
                    message: "Only the comment owner can edit this comment"
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Error editing comment",
                error: err
            });
        });
});

// delete a comment
// tested only with dummy userIds
router.delete('/:commentId', isAuthenticated, (req, res, next) => {
    const id = req.params.commentId;
    const userId = req.user._id;
    Comment.remove({ _id: id, author: userId }, { single: true })
        .exec()
        .then(result => {
            if (result.deletedCount === 1) {
                res.status(200).json({
                    message: "Comment deleted"
                });
            } else {
                res.status(403).json({
                    message: "Only the comment owner can delete this comment"
                })
            }
        })
        .catch(err => {
            console.log(err).json({
                message: "Error deleting comment",
                error: err
            });
        });
});

module.exports = router;