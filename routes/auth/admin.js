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
router.put('/updateImage/:image_id',fileUpload.single('image'),employeeController.updateSingleImage)
router.get('/products',employeeController.getProducts);
router.post('/cart',employeeController.addTocart);
router.post('/cart/vendor',employeeController.addTocartByVendor);
router.post('/accountsTeam/:id/:verify_id',employeeController.verifyOrder)
router.post('/dispatchTeam/:id/:dispatch_id',employeeController.dispatchOrder)
router.get("/admin/package/:id", employeeController.getPackages);
router.put('/management/updateImage/:id',fileUpload.array("images", 3),employeeController.updateProductImage);
router.post('/manufacturerTeam/add/:admin_id',employeeController.createManufacturerTeam)
router.post('/productionTeam/add/:creator_id',employeeController.createProductionTeam)
router.post('/createManufacture/:id',employeeController.createBrandOwnerByManufacture)
router.post('/manufactureProduct/:id',fileUpload.array('images',3),employeeController.createManufactureProduct);
router.post('/createDelivery/:group_id',employeeController.create_delivery);
router.put('/createPayment/:id/:vendor_id',employeeController.payment)
module.exports=router;