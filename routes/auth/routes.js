const express = require('express');
const router = express.Router();
const employeeController=require('../../controllers/employee')
router.post('/userUpload',employeeController.postEmployee);
router.get('/getUser',employeeController.getEmployee);

module.exports = router;