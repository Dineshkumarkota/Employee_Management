const express = require('express');
const router = express.Router();
const employeeController=require('../../controllers/employee');
const fileUpload=require('../../middlewares/fileupload')

router.post("/login", employeeController.login);
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
module.exports = router;