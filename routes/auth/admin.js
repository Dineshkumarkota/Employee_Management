const express = require('express');
const router = express.Router();
const employeeController=require('../../controllers/employee');
const fileUpload=require('../../middlewares/fileupload');
const employeeModel = require('../../models/models');

router.post("/admin/leave/:leave_id/approve", employeeController.approveLeave);
router.post("/admin/leave/:leave_id/reject", employeeController.rejectLeave);
router.post("/admin/vendor/:id", employeeController.addVendorByAdmin);
router.get("/admin/employeesList/:id", employeeController.getEmployeesByAdmin);
router.get("/admin/vendorList/:id", employeeController.getVendorsByAdmin);
router.post(
    '/addProduct/:id',
    fileUpload.array("images", 3),
    employeeController.addProductByAdmin
);
router.get('/products',employeeController.getProducts);
router.post('/cart',employeeController.addTocart);
router.get("/admin/package/:id", employeeController.getPackages);

module.exports=router;