const express = require('express');
const {
  registerUser,
  loginUser,
} = require('../controllers/auth.controller');

// import protect
const protect = require('../middleware/auth.middleware');

// Define auth routes
// Connect routs to controller function

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// added protected route GET /me
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        user: {
            id: req.user._id,
            username: req.user.username,
        },
    });
});

module.exports = router;