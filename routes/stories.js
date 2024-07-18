const express = require('express')
const router = express.Router()
const { ensureAuth } = require('../middleware/auth')
const Story = require('../models/Story')

// @desc Show add page
// @route GET /stories/add
router.get('/add', ensureAuth, (req, res) => {
    res.render('stories/add')
})

// @desc Process add form
// @route POST /stories
router.post('/', ensureAuth, async (req, res) => {
    try {
        req.body.user = req.user.id
        await Story.create(req.body)
        res.redirect('/dashboard')
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

// @desc Show all stories
// @route GET /stories
router.get('/', ensureAuth, async (req, res) => {
    try {
        const stories = await Story.find({ status: 'public' })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean()

        // Convert _id to string
        stories.forEach(story => {
            story._id = story._id.toString()
            if (story.user) {
                story.user._id = story.user._id.toString()
            }
        })

        res.render('stories/index', {
            stories: stories
        })
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

// @desc Show single story
// @route GET /stories/:id
router.get('/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id)
        .populate('user')
        .lean()

        if(!story) {
            res.render('error/404')
        }
        res.render('stories/show', {
            story: story
        })
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

// @desc Show edit page
// @route GET /stories/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
    try {
        const story = await Story.findOne({
            _id: req.params.id
        }).lean()

        if (!story) {
            return res.render('error/404')
        }

        if (story.user != req.user.id) {
            res.redirect('/stories')
        } else {
            res.render('stories/edit', {
                story: story
            })
        }
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

// @desc Update story
// @route PUT /stories/:id
router.put('/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id)

        if (!story) {
            return res.render('error/404')
        }

        if (story.user.toString() !== req.user.id) {
            return res.redirect('/stories')
        }

        story.title = req.body.title
        story.status = req.body.status
        story.body = req.body.body

        await story.save()

        res.redirect('/dashboard')
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

// @desc Delete story
// @route DELETE /stories/:id
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        const story = await Story.findOne({ _id: req.params.id });

        if (!story) {
            return res.render('error/404');
        }

        if (story.user.toString() !== req.user.id) {
            return res.redirect('/stories');
        }

        // Use deleteOne to delete the document
        await Story.deleteOne({ _id: req.params.id });

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});


// @desc Show User stories
// @route GET /stories/user/:userId
router.get('/user/:id', ensureAuth, async (req, res) => {
    try {
        const userId = req.params.id; // Extract userId from params
        console.log(userId);
        const stories = await Story.find({
            user: userId, // Use userId directly
            status: 'public'
        }).populate('user').lean();

        if (!stories) {
            return res.render('error/404'); // Handle case where no stories are found
        }

        res.render('stories/index', {
            stories: stories
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});



module.exports = router
