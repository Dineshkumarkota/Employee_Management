const express = require('express');
const router = express.Router();
const employeeController=require('../../controllers/employee');
const fileUpload=require('../../middlewares/fileupload');
const employeeModel = require('../../models/models');
 

router.post('/management/category/:id',employeeController.addCategory);
router.get('/management/categoryNames/:id',employeeController.getCategoryNameById);
router.post('/management/addAdmin/:id',employeeController.addAdmin)
module.exports=router;