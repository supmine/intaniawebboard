const express = require('express');
const moment = require('moment');

const Topic = require('../models/topic');
const Comment = require('../models/comment');

const upload = require('../util/uploadImage');
const uploadToS3 = require('../util/uploadToS3');

const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (req.user) {
        console.log('authenticated');
        return next();
    } else {
        console.log('not authenticated')
        res.redirect('/login');
        /*res.status(401).json({
            message: "user not authenticated"
        })*/
    }
};

/** return all topics, each topic with 1 latest comment.
 *  return topics are ordered by descending date (topics[0] = oldest)
 */
// /topics/
router.get('/', isAuthenticated, async(req, res) => {
    // console.log(req.session);
    // console.log(req.user);
    const topics = await Topic.find()
        .select('-__v -updatedAt')
        .sort({ createdAt: -1 })
        .populate('author', 'username')
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    const topicAndComment = await Promise.all(topics.map(async(tp) => {
        const comments = await Comment.find({ topic: tp._id })
            .select('-__v -updatedAt')
            .sort({ createdAt: -1 })
            .populate('author', 'username')
            .exec()
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                });
            });
        let commentCount = 0;
        let comment = null;
        if (comments.length > 0) {
            commentCount = comments.length;
            comment = comments[0];
        }
        return {
            topic: tp,
            comment: comment,
            commentCount: commentCount,
            topicCreatedAt: moment(tp.createdAt).format("MMMM DD YYYY, H:mm"),
            request: {
                type: 'GET',
                url: req.protocol + '://' + req.get('host') + req.originalUrl + tp._id
            }
        };
    }));

    /*   res.status(200).json({
           topicCount: topics.length,
           topics: topicAndComment */
    res.render('topics', {
        topicCount: topics.length,
        topics: topicAndComment,
        currentUser: req.user.username
    });

});

// add new topic **expects body in req.body**
// post /topics/
// tested 
router.post('/', isAuthenticated, upload.single('image'), async(req, res) => {
    let imageUrl = null;
    if (req.file) {
        try {
            let data = await uploadToS3(req.file);
            imageUrl = data.Location;
        } catch (err) {
            console.log(err)
            res.status(500).json({
                message: "Error uploading file to storage"
            })
        }
    }

    const newTopic = new Topic({
        body: req.body.body,
        author: req.user._id,
        imageUrl
    });
    newTopic.save()
        .then(result => {
            console.log(result);

            res.redirect('/topics')
                /*res.status(201).json({
                    message: "Created new topic succesfully",
                    topic: {
                        _id: newTopic._id,
                        body: newTopic.body,
                        authorId: newTopic.author,
                        authorUsername: req.user.username,
                        likes: newTopic.likes,
                        imageUrl: newTopic.imageUrl,
                        createdAt: newTopic.createdAt,
                        request: {
                            type: 'GET',
                            url: req.protocol + '://' + req.get('host') + req.originalUrl + newTopic._id
                        }
                    }
                });*/
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Error saving topic to database",
                error: err
            });
        });
});
/** get all comment of a single topic
 *  return all comment ordered by ascending date (ก่อนไปหลัง)
 */ // /topics/sfnkr1n2k2ne0j0d9f
router.get('/:topicId', isAuthenticated, (req, res) => {
    const topicID = req.params.topicId;
    Topic.findById(topicID) //invalid id will throws error. valid but absent id will return null
        .populate('author', 'username')
        .select('-__v -updatedAt')
        .exec()
        .then(topic => {
            if (topic) {
                Comment.find({ topic: topicID }) //if fails will return []
                    .populate('author', 'username')
                    .select('-__v -updatedAt -topic')
                    .then(cms => {
                        const response = {
                            topic,
                            currentUser: req.user.username,
                            topicCreatedAt: moment(topic.createdAt).format("MMMM DD YYYY, H:mm"),
                            comments: cms.map(comment => {
                                return {
                                    _id: comment._id,
                                    likes: comment.likes,
                                    body: comment.body,
                                    createdAt: moment(comment.createdAt).format("MMMM DD YYYY, H:mm"),
                                    author: comment.author,
                                }
                            }),
                        }
                        res.render('comments', response); // comments=[comment1, comment2]; createdAt = comment1.createdAt 
                    })
                    .catch(err => { //error from finding comment
                        console.log(err);
                        res.status(500).json({ error: err });
                    })
            } else { //cant find topic
                res.status(404).json({ message: 'No topic found for provided ID' });
            }
        })
        .catch(err => {;
            console.log(err);
            res.status(500).json({
                message: "Error finding the requested topic (invalidID)",
                error: err,
            });
        });
});


//edit topic **expects newBody in req.body**
//tested only with dummy userIds
router.patch('/:topicId', isAuthenticated, (req, res, next) => {
    const id = req.params.topicId;
    const userId = req.user._id;
    Topic.updateOne({ _id: id, author: userId }, { $set: { body: req.body.newBody } })
        .exec()
        .then(result => {
            console.log(result);
            if (result.nModified === 1) {
                res.status(200).json({
                    message: 'Topic edited',
                    request: {
                        type: 'GET',
                        url: req.protocol + '://' + req.get('host') + req.originalUrl + id
                    }
                });
            } else {
                res.status(405).json({
                    message: "Only the topic owner can edit this topic"
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                message: "Error editing topic",
                error: err
            });
        });
});

//delete topic from db
//tested with only dummy userIds
router.delete('/:topicId', isAuthenticated, (req, res, next) => {
    const id = req.params.topicId;
    const userId = req.user._id;
    Topic.remove({ _id: id, author: userId }, { single: true })
        .exec()
        .then(result => {
            if (result.deletedCount === 1) {
                res.status(200).json({
                    message: "Topic deleted"
                });
            } else {
                res.status(403).json({
                    message: "Only the topic owner can delete this topic"
                })
            }
        })
        .catch(err => {
            console.log(err).json({
                message: "Error deleting topic",
                error: err
            });
        });
});

//add a comment to the topic with id=topicId **expects body, topicId, image in req.body**
//tested only with dummy userIds
router.post('/:topicId/comment', isAuthenticated, upload.single('image'), async(req, res) => {
    const topicId = req.params.topicId;
    let imageUrl = null;
    Topic.findById(topicId)
        .then(async topic => {
            if (!topic) {
                return res.status(404).json({
                    message: 'Topic not Found'
                });
            }
            if (req.file) {
                try {
                    let data = await uploadToS3(req.file);
                    imageUrl = data.Location;
                } catch (err) {
                    console.log(err)
                    res.status(500).json({
                        message: "Error uploading file to storage"
                    });
                }
            }
            const newComment = new Comment({
                body: req.body.body,
                topic: topicId,
                author: req.user._id,
                imageUrl
            });
            return newComment.save();
        })
        .then(result => {
            /*res.status(201).json({
                message: "Comment created",
                comment: {
                    _id: result._id,
                    body: result.body,
                    authorId: result.author,
                    authorUsername: req.user.username,
                    likes: result.likes,
                    imageUrl: result.imageUrl,
                    createdAt: result.createdAt,
                },
                request: {
                    type: 'GET',
                    url: req.protocol + '://' + req.get('host') +'/topics/'+ topicId
                }
              });*/
            res.redirect('/topics/' + topicId)
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;