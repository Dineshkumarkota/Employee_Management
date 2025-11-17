const express = require('express');
const router = express.Router();
const employeeController=require('../../controllers/employee');
const fileUpload=require('../../middlewares/fileupload');
router.post('/userUpload', fileUpload.single('checks'),employeeController.postEmployee);
router.get('/getUser',employeeController.getEmployee);

module.exports = router;