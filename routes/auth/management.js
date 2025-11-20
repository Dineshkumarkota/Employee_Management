const express = require('express');
const router = express.Router();
const employeeController=require('../../controllers/employee');
const fileUpload=require('../../middlewares/fileupload');
const employeeModel = require('../../models/models');
 

router.post('/management/category/:id',employeeController.addCategory);
router.get('/management/categoryNames/:id',employeeController.getCategoryNameById);
router.post('/management/addAdmin/:id',employeeController.addAdmin);
router.get('/management/products/:id',employeeController.getProductByMngId);
router.post(
    '/management/addcategory/:id',
    fileUpload.array("images", 3),
    employeeController.addProductsByManagement
);
router.post('/createPackage/:id',employeeController.createPackage)
module.exports=router;