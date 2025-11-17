const express = require('express');
const router = express.Router();
const employeeController=require('../../controllers/employee');
const fileUpload=require('../../middlewares/fileupload');
const employeeModel = require('../../models/models');

router.post("/login",employeeController.login);
router.post("/forgot/checkUser",employeeController.checkUser);
router.post('/forgot/check-answers',employeeController.checkAnswers);
router.put('/password/reset-password',employeeController.resetPassword);
router.post('/question',employeeController.createQuestion)
router.put('/updatequestion/:id',employeeController.updateQuestion)
router.get('/getquestion/:id',employeeController.getQuestion)
router.get('/getallquestions',employeeController.getAllQuestions)
router.delete('/deletequestion/:id',employeeController.deleteQuestion)
router.put(
  "/employee/profile-image/:id",
  fileUpload.single("image"),
  employeeController.updateProfileImage
);
router.put(
  "/employee/:id/profile",
  fileUpload.single("image"),
  employeeController.updateProfile
);
router.post("/attendance/:id/login", employeeController.markLogin);
router.post("/attendance/:id/logout", employeeController.markLogout);
router.post("/employee/:id/leave", employeeController.applyLeave);
router.post("/admin/leave/:leave_id/approve", employeeController.approveLeave);
router.post("/admin/leave/:leave_id/reject", employeeController.rejectLeave);
router.post("/vendor/add", employeeController.addVendor);
router.get("/vendor/list/:id", employeeController.getVendorById);
router.get('/vendors',employeeController.getAllVendors);
router.get('/roleslevel/:id',employeeController.getRoleHeirarchy);
router.post("/admin/vendor/:id", employeeController.addVendorByAdmin);
router.get("/admin/employeesList/:id", employeeController.getEmployeesByAdmin);
router.get("/admin/vendorList/:id", employeeController.getVendorsByAdmin);
router.post('/addProduct/:id',employeeController.addProductByAdmin);
router.get('/products',employeeController.getProducts);
router.post('/cart',employeeController.addTocart)
module.exports = router;