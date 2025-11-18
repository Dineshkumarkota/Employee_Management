const express = require('express');
const router = express.Router();


router.use("/auth",require('./auth/routes'));
router.use("/unauth",require('./unauth/unauth'));
router.use('/auth',require('./auth/admin'));
router.use('/auth',require('./auth/management'))

module.exports = router;