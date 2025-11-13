const express = require('express');
const router = express.Router();


router.use("/auth",require('./auth/routes'));
router.use("/unauth",require('./unauth/unauth'));

module.exports = router;