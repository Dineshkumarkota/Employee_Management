const Joi = require('joi');
const bcrypt = require("bcrypt");
const employeeModel = require('../models/models');
const moment = require("moment");
const fileValidate = require('../utils/fileValidate')
const { copyFile, deleteFile } = require('../utils/copyFile');
const express = require('express');


let employeeController = {
    postEmployee: async (req, res) => {

        const updateSchema = Joi.object({
            name: Joi.string().min(1).max(100).optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().min(5).max(20).optional(),
            address: Joi.string().max(255).optional(),
            salary: Joi.number().min(0).optional(),
            joining_date: Joi.date().optional(),
            login_id: Joi.string().min(4).max(50).optional(),
            password: Joi.string()
                .min(6)
                .max(13)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#.%*?&])[A-Za-z\d@$!#.%*?&]+$/)
                .optional(),
            location: Joi.string().min(2).max(100).optional(),
            role: Joi.string().min(2).max(100).optional(),
            designation: Joi.string().min(2).max(100).optional(),
            sales_target: Joi.number().min(0).optional(),
            TA: Joi.number().min(0).optional(),
            DA: Joi.number().min(0).optional(),
            previous_experience: Joi.number().min(0).required(),
            alternate_number: Joi.string().min(5).max(20).required(),
            pan_number: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
            blood_group: Joi.string().min(2).max(100).required(),
            PF: Joi.number().min(0).optional()
        });
        let validate = updateSchema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
        }


        let allErrors = [];
        if (req.file) {
            const filevalidation = fileValidate(req.file, [".jpg", ".jpeg", ".png", ".webp"], 2);
            if (!filevalidation.valid) {
                allErrors.push({ field: "image", message: filevalidation.message });
            }
        }

        if (allErrors.length > 0) {
            return res.status(422).json({ message: allErrors });
        }
        try {


            const existingEmail = await employeeModel.getByEmail(req.body.email);
            if (existingEmail.length > 0) {
                throw { error: 'VALID_ERROR', message: "Email already exists." };
            }

            // Check if login_id already exists
            const existingLogin = await employeeModel.getByLoginId(req.body.login_id);

            if (existingLogin.length > 0) {
                throw { error: 'VALID_ERROR', message: "Login ID already exists." };
            }
            if ((req.body.phone) === req.body.alternate_number) {
                throw { error: 'VALID_ERROR', message: "Alternate mobile number should be different from original number" }
            }
            const existingPan = await employeeModel.checkPan(req.body.pan_number);

            if (existingPan.length > 0) {
                throw { error: 'VALID_ERROR', message: "Pan already exists" }
            }
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            if (req.file) {
                try {

                    const destFolder = "check";


                    await copyFile(req.file, destFolder);
                    await deleteFile(req.file.path);


                } catch (fileErr) {
                    console.error("File operation failed:", fileErr);
                    return res.status(500).json({ message: "File handling failed", error: fileErr.message || fileErr });
                }
            }
            const checkUploadName = req.file.filename;
            console.log(checkUploadName);

            const newEmployee = {
                ...req.body,
                checks_upload: checkUploadName,
                password: hashedPassword
            }

            const inserted = await employeeModel.postEmployeeById(newEmployee);
            let employee_id = inserted[0];
            console.log(employee_id);



            // console.log(id);

            res.status(201).json({
                message: "Employee created successfully",
                employee_id
            });

        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }

    },
    getEmployee: async (req, res) => {
        try {
            const result = await employeeModel.getEmployeeModel();
            return res.status(200).json({ message: "Conversations fetched successfully", data: result });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    login: async (req, res) => {
        if (req.body) {
            const loginSchema = Joi.object({
                login_id: Joi.string().required(),
                password: Joi.string()
                    .min(6)
                    .max(13)
                    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#.%*?&])[A-Za-z\d@$!#.%*?&]+$/)
                    .required(),
            });

            const { error } = loginSchema.validate(req.body, { abortEarly: false });
            if (error) {
                const errorDetails = error.details.map((err) => err.message);
                return res.status(422).json({ data: errorDetails })
            } else {
                try {
                    const { login_id, password } = req.body;
                    console.log("Entered password:", password);
                    const user = await employeeModel.loginValidation(login_id);

                    if (!user) {
                        throw { status: 422, message: "Invalid Login ID or password." };
                    }
                    console.log("Stored hash:", user.password);

                    const isMatch = await bcrypt.compare(password, user.password);
                    console.log("Password Match:", isMatch);

                    if (!isMatch) {
                        throw { status: 422, message: "Invalid Login ID or password." };
                    }
                    return res.status(200).json({
                        message: "Login successful",
                        employee_id: user.employee_id,
                        name: user.name,
                        role: user.role,
                    });

                } catch (error) {
                    if (error.status) {
                        return res.status(error.status).json({ message: error.message });
                    }

                    console.log("LOGIN ERROR:", error);
                    return res.status(500).json({ message: "Server error" });
                }
            }
        } else {
            return res.status(400).json({ message: "Invalid Data." });
        }
    },
    checkUser: async (req, res) => {
        let formvalidation = Joi.object({
            username: Joi.string().min(3).max(16).required()
        })
        let { error } = formvalidation.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (error) {
            errorDetails = error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: errorDetails })
        } else {
            try {
                const { username } = req.body;
                const user = await employeeModel.findUserByUsername(username);
                if (!user) {
                    throw { message: "User not found." };
                }

                const questions = await employeeModel.getSecurityQuestionsForUser(user.employee_id)

                return res.status(200).json({
                    message: "User verified.",
                    questions,
                });
            } catch (error) {
                console.log("CHECK USER ERROR:", error);
                if (error.errorCode === "VALID_ERROR") {
                    return res.status(422).json({
                        message: error.message,
                    });
                }
                return res.status(409).json({
                    message: error.message,
                })
            }
        }
    },
    checkAnswers: async (req, res) => {
        const schema = Joi.object({
            username: Joi.string().required(),
            answers: Joi.array()
                .items(
                    Joi.object({
                        qid: Joi.number().required(),
                        answer: Joi.string().required(),
                    })
                )
                .required(),
        });

        let { error } = schema.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (error) {
            errorDetails = error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: errorDetails })
        }
        else {
            try {
                const max_attempts = 3;
                const COOLDOWN_MINUTES = 5;
                const { username, answers } = req.body;
                const user = await employeeModel.findUserByUsername(username);
                if (!user) {
                    throw { errorCode: "VALID_ERROR", message: "User not found" }
                }
                // console.log("Failed attempts:", user.failed_attempts);
                // console.log("MAX_ATTEMPTS:", max_attempts);
                if (user.failed_attempts >= max_attempts) {
                    // const lastTry = moment(user.last_failed_attempt);
                    // console.log(lastTry);

                    const now = moment();
                    // console.log(moment().minutes());

                    const diffMins = now.diff(user.last_failed_attempt, "minutes");
                    console.log("diffMins:", diffMins, "last_failed_attempt:", user.last_failed_attempt);

                    if (diffMins < COOLDOWN_MINUTES) {
                        const waitTime = COOLDOWN_MINUTES - diffMins;
                        console.log(waitTime);

                        return res.status(429).json({
                            message: `Too many failed attempts. Try again in ${waitTime} minutes`
                        })
                    }
                    else {

                        await employeeModel.resetFailedAttempts(user.employee_id);
                    }
                }
                const storedAnswers = await employeeModel.getUserAnswers(user.employee_id);


                const answerMap = {};
                storedAnswers.forEach((a) => {
                    answerMap[a.qid] = a.answer.toLowerCase();
                });
                //   console.log(answerMap);

                let incorrect = false;
                for (const { qid, answer } of answers) {
                    if (!answerMap[qid] || answerMap[qid] !== answer.toLowerCase()) {
                        incorrect = true;
                        break;
                    }
                }
                if (incorrect) {
                    await employeeModel.increaseFailedAttempts(user.employee_id, moment().format());
                    return res.status(400).json({
                        message: "Incorrect answers. Please try again.",
                    });
                }
                await employeeModel.resetFailedAttempts(user.employee_id);
                res.status(200).json({ message: "All answers matched successfully" });

            } catch (err) {
                console.log(err);
                if (err.errorCode === "VALID_ERROR") {
                    return res.status(422).json({
                        message: error.message,
                    });
                }
                return res.status(409).json({
                    message: error.message,
                })
            }
        }
    },
    resetPassword: async (req, res) => {
        const schema = Joi.object({
            username: Joi.string().required(),
            newPassword: Joi.string().min(6).max(20).required(),
            confirmPassword: Joi.string().min(6).max(20).required().valid(Joi.ref('newPassword')),
        });

        let { error } = schema.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (error) {
            errorDetails = error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: errorDetails })
        }
        else {
            try {
                const { username, newPassword, confirmPassword } = req.body;


                const user = await employeeModel.findUserByUsername(username);
                console.log("newPassword:", newPassword);
                console.log("user.password:", user.password);

                let compare = await bcrypt.compare(newPassword, user.password);
                console.log(compare);
                if (compare) {
                    throw { errorCode: "VALID_ERROR", message: "Old and new passwords shouldnt be same" }
                }
                if (!user) {
                    throw { errorCode: "VALID_ERROR", message: "User Not found" }
                };

                const hashed = await bcrypt.hash(newPassword, 10);
                await employeeModel.updatePassword(username, hashed);

                res.status(200).json({ message: "Password updated successfully" });

            } catch (err) {
                console.log(err);
                if (err.errorCode === "VALID_ERROR") {
                    return res.status(422).json({
                        message: err.message,
                    });
                }
                return res.status(409).json({
                    message: error.message,
                })
            }
        }

    },
    createQuestion: async (req, res) => {
        const schema = Joi.object({
            question: Joi.string().min(10).max(500).pattern(/^[a-zA-Z0-9\s.,?'-]+$/).required()
        });
        let { error } = schema.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (error) {
            errorDetails = error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: errorDetails });
        } else {
            try {
                let { question } = req.body
                console.log('que', question);

                if (!question) {
                    throw { errorCode: 'VALID_ERROR', message: 'cannot found the question' }
                }
                let result = await employeeModel.createQuestion(question)
                console.log('res', result);

                if (result.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'cannot create a question' }
                }
                return res.status(200).json({ message: 'created succesfully', data: question })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }

            }
        }

    },
    getQuestion: async (req, res) => {
        try {
            let { id } = req.params
            if (!id) {
                throw { errorCode: 'VALID_ERROR', message: 'cannot get the id' }
            }
            let question = await employeeModel.getQuestionById(id)
            if (!question || question.length == 0) {
                throw { errorCode: 'VALID_ERROR', message: 'cannot found the quesion' }
            }
            return res.status(200).json({ message: 'question fetched succesfully', data: question })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    getAllQuestions: async (req, res) => {
        try {
            let questions = await employeeModel.getAllQuestions()
            // if(questions.length==0){
            //     throw {errorCode:'VALID_ERROR',message:'cannot found the questions'}
            // }
            return res.status(200).json({ message: 'all quesions fetched succesfully', data: questions })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    updateQuestion: async (req, res) => {
        let formvalidation = Joi.object({
            question: Joi.string().min(10).max(500).pattern(/^[a-zA-Z0-9\s.,?'-]+$/).required()
        })
        let { error } = formvalidation.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (error) {
            errorDetails = error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: errorDetails })
        } else {
            try {
                let { id } = req.params
                let { question } = req.body
                if (!question) {
                    throw { errorCode: 'VALID_ERROR', message: 'provide question' }
                }
                let checking = await employeeModel.getQuestionById(id)
                if (checking.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'cannot found the question' }
                }
                let result = await employeeController.updateQuestion(question, id)
                if (result.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'cannot update the question' }
                }
                return res.status(200).json({ message: 'update succesfully', data: req.body })

            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }

    },
    deleteQuestion: async (req, res) => {
        try {
            let { id } = req.params
            if (!id) {
                throw { errorCode: 'VALID_ERROR', message: 'cannot get the id' }
            }
            let deleteQue = await employeeModel.deleteQuestion(id)
            console.log(deleteQue);
            if (!deleteQue) {
                throw { errorCode: 'VALID_ERROR', message: 'cannot delete the question' }
            }

            return res.status(200).json({ message: 'question deleted succesfully' })

        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    updateProfile: async (req, res) => {
        const schema = Joi.object({
            name: Joi.string().min(1).max(100).optional(),
            phone: Joi.string().min(5).max(20).optional(),
            address: Joi.string().max(255).optional()
        });

        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const details = error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ data: details });
        }
        let allErrors = [];
        if (req.file) {
            const filevalidation = fileValidate(req.file, [".jpg", ".jpeg", ".png", ".webp"], 2);
            if (!filevalidation.valid) {
                allErrors.push({ field: "image", message: filevalidation.message });
            }
        }

        if (allErrors.length > 0) {
            return res.status(422).json({ message: allErrors });
        }

        try {
            const { id } = req.params;
            const { name, phone, address } = req.body;

            const employee = await employeeModel.getEmployeeById(id);
            if (!employee) {
                throw { errorCode: "VALID_ERROR", message: "Employee not found" };
            }
            if (phone) {
                const existing = await employeeModel.checkContact(phone);
                if (existing.length > 0 && existing[0].employee_id !== Number(id)) {
                    throw { errorCode: "VALID_ERROR", message: "Phone number already in use by another employee" };
                }
            }
            let file_url = employee.file_url;
            if (req.file) {
                const destFolder = "profile";
                await copyFile(req.file, destFolder);
                await deleteFile(req.file.path);
                if (file_url) {
                    await deleteFile(`uploads/profile/${file_url}`);
                }
                file_url = req.file.filename;
            }
            const updatedData = { name, phone, address, file_url };
            const updated = await employeeModel.updateProfile(updatedData, id);
            if (!updated) {
                throw { errorCode: "API_ERROR", message: "Failed to update employee" };
            }
            res.status(200).json({
                message: "Profile updated successfully",
                updated_fields: updatedData
            });

        } catch (error) {
            console.error("Profile update error:", error);
            if (error.errorCode === "VALID_ERROR") {
                return res.status(422).json({ message: error.message });
            } else if (error.errorCode === "API_ERROR") {
                return res.status(500).json({ message: error.message });
            }
            else {
                return res.status(409).json({ error: error.message });
            }
        }
    },
    updateProfileImage: async (req, res) => {
        let allErrors = [];
        // Validate File
        let filevalidation;
        if (req.file) {
            filevalidation = fileValidate(
                req.file,
                [".jpg", ".jpeg", ".png", "webp"],
                2
            );

            if (!filevalidation.valid) {
                allErrors.push({
                    field: "image",
                    message: filevalidation.message,
                });
            }
        }
        // If there are any validation errors
        if (allErrors.length > 0) {
            // const base64Result = await cypherResponce.generate(req.session.encKey, allErrors);
            return res.status(422).json({
                message: allErrors
            });
        }
        try {
            const { id } = req.params;
            const image = await employeeModel.getEmployeeById(id);
            console.log(image);

            if (!req.file) {
                throw { errorCode: 'VALID_ERROR', message: 'Please upload an image' }
            }
            const employee = await employeeModel.getEmployeeById(id);
            if (!employee) {
                throw { errorCode: "VALID_ERROR", message: "Employee not found" };
            }
            const destFolder = "profile";
            await copyFile(req.file, destFolder);
            await deleteFile(req.file.path);
            let newImageData = {
                file_url: req.file.filename,
            }
            console.log(newImageData);
            await employeeModel.updateEmployeeImage(id, newImageData);
            await deleteFile(`uploads/profile/${image.file_url}`);
            res.status(200).json({
                data: { id, message: "uploaded successfully" }
            });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    markLogin: async (req, res) => {
        try {
            const { id } = req.params;
            const employee = await employeeModel.getEmployeeById(id);
            if (!employee) {
                throw { errorCode: "VALID_ERROR", message: "Employee not found" };
            }
            const today = moment().format('YYYY-MM-DD');
            const now = moment().format("HH:mm:ss");
            const existing = await employeeModel.getAttendanceByDate(id, today);
            if (existing) {
                throw { error: "VALID_ERROR", message: "Already logged in today" }
            }
            const newAttendance = {
                employee_id: id,
                work_date: today,
                login_time: now,
                status: "Present"
            }
            await employeeModel.createAttendance(newAttendance);
            res.status(201).json({ message: "Login time marked", time: now });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    markLogout: async (req, res) => {
        try {
            let { id } = req.params;
            const employee = await employeeModel.getEmployeeById(id);
            if (!employee) {
                throw { errorCode: "VALID_ERROR", message: "Employee not found" };
            }
            const today = moment().format('YYYY-MM-DD');


            const attendance = await employeeModel.getAttendanceByDate(id, today);
            if (!attendance || !attendance.login_time) {
                throw { error: "VALID_ERROR", message: "No login record for today" };
            }
            if (attendance.logout_time) {
                throw { error: "VALID_ERROR", message: "Already logged out today" };
            }
            const loginTime = attendance.login_time;
            console.log("loginTime===>", loginTime);

            const logoutTime = moment().format("YYYY-MM-DD HH:mm:ss");
            console.log("logout===>", logoutTime);

            // const loginDateTime = `${today} ${loginTime}`
            const loginDate = new Date(loginTime);
            const logoutDate = new Date(logoutTime);
            // console.log(logoutTime);
            const diffMs = logoutDate - loginDate
            // console.log(diffMs);
            const diffSeconds = Math.floor(diffMs / 1000);
            const hours = Math.floor(diffSeconds / 3600);
            const minutes = Math.floor((diffSeconds % 3600) / 60);
            const seconds = diffSeconds % 60;

            let totalHours = `${hours}:${minutes}:${seconds}`



            const updateData = {
                logout_time: logoutTime,
                total_work_time: totalHours
            };
            await employeeModel.updateAttendance(id, today, updateData);
            res.status(200).json({
                message: "Logout marked successfully",
                total_hours: totalHours
            });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    applyLeave: async (req, res) => {
        const schema = Joi.object(
            {
                start_date: Joi.string().required(),
                end_date: Joi.string().required(),
                reason: Joi.string().max(100).required()
            });
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
        }

        try {
            let { id } = req.params;
            const { start_date, end_date, reason } = req.body;
            const startDate = new Date(start_date);
            const endState = new Date(end_date);
            const diffMs = endState - startDate;
            const num_days = diffMs / (1000 * 60 * 60 * 24) + 1;
            const employee = await employeeModel.getEmployeeById(id);
            if (employee.length === 0) {
                throw { errorCode: "VALID_ERROR", message: "Employee not found" };
            }
            const payload = {
                employee_id: id,
                start_date,
                end_date,
                num_days,
                reason: reason,
                status: "Pending",
                applied_at: moment().format("YYYY-MM-DD HH:mm:ss")
            };
            const insertRes = await employeeModel.createLeaveRequest(payload);
            return res.status(201).json({
                message: "Leave request submitted",
                data: { leave_id: insertRes[0], status: "Pending", num_days }
            });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    approveLeave: async (req, res) => {
        const schema = Joi.object({
            admin_message: Joi.string().required()
        })
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
        }

        try {
            const { leave_id } = req.params;
            const { admin_message } = req.body;
            const leave = await employeeModel.getLeaveById(leave_id);
            if (leave.length === 0) {
                throw { errorCode: "VALID_ERROR", message: "Leave request not found" }
            }
            if (leave[0].status != "Pending") {
                throw { errorCode: "VALID_ERROR", message: "Only pending requests can be approved" };
            }
            const employee = await employeeModel.getEmployeeById(leave.employee_id);
            if (employee.lenght === 0) {
                throw { errorCode: "VALID_ERROR", message: "Employee not found" }
            }
            let newLeavesTaken = employee[0].leaves_taken + leave[0].num_days;

            // console.log("leaves_taken", employee.leaves_taken);



            let newRemaining = employee[0].remaining_leaves - leave[0].num_days;

            // console.log("leaves", employee.remaining_leaves);
            await employeeModel.updateLeaveStatus(leave_id, {
                status: "Approved",
                admin_message: admin_message,
                reviewed_at: moment().format("YYYY-MM-DD HH:mm:ss")
            });
            await employeeModel.updateEmployeeLeaves(employee.employee_id, {
                leaves_taken: newLeavesTaken,
                remaining_leaves: newRemaining,
                total_leaves: 10
            })
            return res.status(200).json({ message: "Leave approved", data: { leave_id } });

        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    rejectLeave: async (req, res) => {
        const schema = Joi.object({
            admin_message: Joi.string().required()
        });
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
        }
        try {
            const { leave_id } = req.params;
            const { admin_message } = req.body;
            const leave = await employeeModel.getLeaveById(leave_id);
            if (leave.length === 0) {
                throw { errorCode: "VALID_ERROR", message: "Leave request not found" }
            }
            if (leave[0].status != "Pending") {
                throw { errorCode: "VALID_ERROR", message: "Only pending requests can be approved" };
            }
            await employeeModel.updateLeaveStatus(leave_id, {
                status: "Rejected",
                admin_message,
                reviewed_at: moment().format("YYYY-MM-DD HH:mm:ss")
            });
            return res.status(200).json({ message: "Leave Rejected", data: { leave_id } });

        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    addVendor: async (req, res) => {
        const schema = Joi.object({
            employee_id: Joi.number().required(),
            vendor_name: Joi.string().required(),
            organisation_name: Joi.string().required(),
            location: Joi.string().required(),
            mobile: Joi.string().min(5).max(20).required(),
            email: Joi.string().email().required()
        })
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];
        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
        }
        try {
            const { employee_id, vendor_name, organisation_name, location, mobile, email } = req.body;
            const existingEmail = await employeeModel.getVendorEmail(email);
            if (existingEmail.length > 0) {
                throw { error: 'VALID_ERROR', message: "Vendor with the same email already exists" }
            }
            const existingNum = await employeeModel.getVendorNumber(mobile);
            if (existingNum.length > 0) {
                throw { error: 'VALID_ERROR', message: "Vendor with the same number already exists" }
            }
            const payLoad = {
                employee_id,
                vendor_name,
                organisation_name,
                location,
                mobile,
                email,
                created_at: moment().format()
            }
            await employeeModel.updateVendor(payLoad);
            return res.status(200).json({
                message: "Vendor added successfully",
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }

    },
    getVendorById: async (req, res) => {
        try {
            let { id } = req.params;
            const vendors = await employeeModel.getVendorsByEmpId(id);
            return res.status(200).json({
                id,
                vendors
            })
        } catch (error) {
            return res.status(404).json({ message: "Not found" });
        }
    },
    getAllVendors: async (req, res) => {
        try {
            const vendors = await employeeModel.getVendors();
            return res.status(200).json({
                message: "got all vendors",
                data: vendors
            })
        } catch (error) {
            return res.status(404).json({ message: "Not found" });
        }
    },
    getRoleHeirarchy: async (req, res) => {
        try {
            const { id } = req.params;
            const emp = await employeeModel.getEmployeeById(id);
            if (emp.length === 0) {
                throw { errorCode: "VALID_ERROR", message: "Employee not found" };
            }
            const currentRole = emp[0].role_id;
            // console.log(currentRole);

            const higherRoles = await employeeModel.getHigherRoles(currentRole);

            let manager = null;
            for (let role of higherRoles) {
                const employees = await employeeModel.getEmployeeRoleLevel(role.role_id);
                if (employees.length > 0) {
                    manager = employees[0];
                    manager.role_name = role.role_name;
                    break;
                }
            }
            if (!manager) {
                return res.status(200).json({
                    message: "No higher-level manager available",
                    reports_to: null
                });
            }
            return res.status(200).json({
                employee_id: id,
                current_role_level: currentRole,
                reeportsTo: manager
            });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    addVendorByAdmin: async (req, res) => {
        const schema = Joi.object({
            employee_id: Joi.number().required(),
            vendor_name: Joi.string().required(),
            organisation_name: Joi.string().required(),
            location: Joi.string().required(),
            mobile: Joi.string().min(5).max(20).required(),
            email: Joi.string().email().required()
        })
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });
        let allErrors = [];
        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
        }
        try {
            const { employee_id, vendor_name, organisation_name, location, mobile, email } = req.body;
            const { id } = req.params;
            const emp = await employeeModel.getEmployeeById(req.body.employee_id);
            if (emp.length === 0) {
                throw { errorCode: "VALID_ERROR", message: "Employee not found" };
            }
            const admin = await employeeModel.getAdminByid(id);
            if (!admin) {
                throw { errorCode: "VALID_ERROR", message: "Admin not found" };
            }
            const existingEmail = await employeeModel.getVendorEmail(email);
            if (existingEmail.length > 0) {
                throw { error: 'VALID_ERROR', message: "Vendor with the same email already exists" }
            }
            const existingNum = await employeeModel.getVendorNumber(mobile);
            if (existingNum.length > 0) {
                throw { error: 'VALID_ERROR', message: "Vendor with the same number already exists" }
            }
            const payLoad = {
                employee_id,
                admin_id: id,
                vendor_name,
                organisation_name,
                location,
                mobile,
                email,
                created_at: moment().format()
            }
            // console.log(payLoad);
            await employeeModel.updateVendor(payLoad);
            return res.status(200).json({
                message: "Vendor added successfully",
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    getEmployeesByAdmin: async (req, res) => {
        try {
            let { id } = req.params;
            const admin = await employeeModel.getAdminByid(id);
            if (!admin) {
                throw { errorCode: "VALID_ERROR", message: "Admin not found" };
            }
            return res.status(200).json({
                message: "Got eomployee details successfully",
                data: admin
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    getVendorsByAdmin: async (req, res) => {
        try {
            let { id } = req.params;
            let admin = await employeeModel.getAdminVendor(id);
            if (!admin) {
                throw { errorCode: "VALID_ERROR", message: "Admin not found" };
            }
            return res.status(200).json({
                message: "Got vendors details successfully",
                data: admin
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    addProductByAdmin: async (req, res) => {
        const schema = Joi.object({
            name: Joi.string().required(),
            price: Joi.number().required(),
            description: Joi.string().min(5).required(),
            category: Joi.string().required(),
        });
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
        }
        if (!req.files || req.files.length === 0) {
            allErrors.push({
                field: "images",
                message: "atlease one image is required"
            })
        }
        else {
            if (req.files.length > 5) {
                allErrors.push({
                    field: "images",
                    message: "max 5 images are allowed"
                })
            }
        }
        let totalSize = 0;
        for (let i = 0; i < req.files.length; i++) {
            let file = req.files[i];
            const filevalidation = fileValidate(
                file,
                [".jpg", ".jpeg", ".png", ".webp"], 2
            );
            totalSize = totalSize + req.files[i].size;
            if (!filevalidation.valid) {
                allErrors.push({
                    field: `images[${i}]`,
                    message: filevalidation.message
                });
            }
        }
        if (totalSize > 5 * 1024 * 1024) {
            allErrors.push({
                field: `images`,
                message: "total size should not exist 5MB"
            });
        }
        if (allErrors.length > 0) {
            return res.status(422).json({ data: allErrors });
        }

        try {
            let { id } = req.params;
            const admin = await employeeModel.getAdminData(id);
            if (admin.length === 0) {
                throw { error: "VALID_ERROR", message: "Admin not found" }
            }
            let { name, price, description, category } = req.body;
            const product = {
                management_id: admin[0].management_id,
                admin_id: id,
                name: name,
                price: price,
                description: description,
                category,
                created_at: moment().format()
            }
            let productData = await employeeModel.addProduct(product);
            let productId = productData[0];
            let destFolder = 'products';


            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                await copyFile(file, destFolder);
                await deleteFile(file.path);
                await employeeModel.addProductImage({
                    product_id: productId,
                    image_url: file.filename,
                    mime_type: file.mimetype,
                    created_at: moment().format()
                });
            }

            return res.status(201).json({ message: "Product added", data: productId });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }

    },
    getProducts: async (req, res) => {
        try {
            const products = await employeeModel.getProducts();
            res.status(200).json({
                message: "got details successfully",
                data: products
            })
        } catch (error) {
            return res.status(409).json({
                error: error.message
            })
        }
    },
    addTocart: async (req, res) => {
        const schema = Joi.object({
            employee_id: Joi.number().required(),
            vendor_id: Joi.number().min(1).required(),
            products: Joi.array().items(
                Joi.object({
                    product_id: Joi.number().required(),
                    quantity: Joi.number().required(),
                })
            ).required()
        })
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });
        let allErrors = [];
        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ message: allErrors })
        }
        try {
            const { employee_id, products, vendor_id } = req.body;
            const emp = await employeeModel.getEmployeeById(employee_id);
            if (emp.length === 0) {
                throw { error: "VALID_ERROR", message: "Employee not found" };
            }
            const vendors = await employeeModel.getVendorsByEmpId(employee_id);
            // console.log(vendors);
            const created_by = 0;
            const group_id = Date.now();
            for (let i = 0; i < products.length; i++) {
                const productData = products[i];
                const { product_id, quantity } = productData;
                const product = await employeeModel.getProductById(product_id);
                if (product.length === 0) {
                    throw { error: "VALID_ERROR", message: "Product not found" };
                }
                const itemPrice = product[0].price;
                const totalPrice = itemPrice * quantity;
                const discountRate = vendors[0].discount / 100;
                const discountAmount = totalPrice * discountRate;
                const finalPrice = totalPrice - discountAmount;

                const existing = await employeeModel.findCartItem(employee_id, product_id, vendor_id, created_by);
                if (existing.length > 0) {
                    const quant = existing[0].quantity + quantity;
                    const total_price = quant * itemPrice;
                    const updated_discount = total_price * discountRate;
                    const updated_final_price = total_price - updated_discount;
                    let payLoad = {
                        employee_id,
                        product_id,
                        vendor_id,
                        quantity: quant,
                        created_by,
                        group_id: existing[0].group_id,
                        total_price: total_price,
                        total_price_discount: updated_final_price
                    }
                    await employeeModel.updateQuantity(payLoad);
                } else {
                    const payLoad = {
                        employee_id,
                        product_id,
                        quantity,
                        admin_id: emp[0].admin_id,
                        status: 1,
                        price: itemPrice,
                        total_price: totalPrice,
                        created_at: moment().format(),
                        vendor_id,
                        group_id,
                        created_by,
                        total_price_discount: finalPrice
                    }
                    await employeeModel.addToQuantity(payLoad);
                }
            }
            return res.status(201).json({ message: "Added to cart" });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    addTocartByVendor: async (req, res) => {
        const schema = Joi.object({
            employee_id: Joi.number().required(),
            vendor_id: Joi.number().min(1).required(),
            products: Joi.array().items(
                Joi.object({
                    product_id: Joi.number().required(),
                    quantity: Joi.number().required(),
                })
            ).required()
        })
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });
        let allErrors = [];
        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ message: allErrors })
        }
        try {
            const { employee_id, products, vendor_id } = req.body;
            const emp = await employeeModel.getEmployeeById(employee_id);
            if (emp.length === 0) {
                throw { error: "VALID_ERROR", message: "Employee not found" };
            }
            const vendors = await employeeModel.getVendorsByEmpId(employee_id);
            // console.log(vendors);
            const created_by = 1;
            const group_id = Date.now();
            for (let i = 0; i < products.length; i++) {
                const productData = products[i];
                const { product_id, quantity } = productData;
                const product = await employeeModel.getProductById(product_id);
                if (product.length === 0) {
                    throw { error: "VALID_ERROR", message: "Product not found" };
                }
                const itemPrice = product[0].price;
                const totalPrice = itemPrice * quantity;
                const discountRate = vendors[0].discount / 100;
                const discountAmount = totalPrice * discountRate;
                const finalPrice = totalPrice - discountAmount;

                const existing = await employeeModel.findCartItem(employee_id, product_id, vendor_id, created_by);
                if (existing.length > 0) {
                    const quant = existing[0].quantity + quantity;
                    const total_price = quant * itemPrice;
                    const updated_discount = total_price * discountRate;
                    const updated_final_price = total_price - updated_discount;
                    let payLoad = {
                        employee_id,
                        product_id,
                        vendor_id,
                        quantity: quant,
                        created_by,
                        group_id,
                        total_price: total_price,
                        total_price_discount: updated_final_price
                    }
                    await employeeModel.updateQuantity(payLoad);
                } else {
                    const payLoad = {
                        employee_id,
                        product_id,
                        quantity,
                        admin_id: emp[0].admin_id,
                        status: 1,
                        price: itemPrice,
                        total_price: totalPrice,
                        created_at: moment().format(),
                        vendor_id,
                        created_by,
                        group_id,
                        total_price_discount: finalPrice
                    }
                    await employeeModel.addToQuantity(payLoad);
                }
            }
            return res.status(201).json({ message: "Added to cart" });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    verifyOrder: async (req, res) => {
        let formvalidation = Joi.object({
            status: Joi.string().min(1).max(150).required(),
            quantity: Joi.number().integer().optional()
        })
        let validation = formvalidation.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (validation.error) {
            errorDetails = validation.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: errorDetails })
        } else {
            try {
                let { id, verify_id } = req.params
                const order = await employeeModel.getOrderById(id)
                if (order.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'order not found' }
                }
                if (order[0].status != 1) {
                    throw { errorCode: 'API_ERROR', message: 'accounts team already reacted for this order' }
                }
                const vendor_id = order[0].vendor_id
                const vendor = await employeeModel.getVendorsByEmpId(vendor_id)
                if (vendor.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'vendor not found' }
                }
                let verifier = await employeeModel.getTeamRoleById(verify_id)
                if (verifier.length == 0 || verifier[0].role_id != 7) {
                    throw { errorCode: 'API_ERROR', message: 'invalid verifier' }
                }
                const product = await employeeModel.getProductById(order[0].product_id)
                if (product.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'cannot found the product' }
                }
                const stock = product[0].stock
                if (stock >= order[0].quantity) {
                    const payload = {
                        status: req.body.status,
                        verified_by: verify_id
                    }
                    const data = {
                        stock: stock - order[0].quantity
                    }
                    await employeeModel.updateOrderById(id, payload);
                    await employeeModel.updateProduct(order[0].product_id, data)
                    return res.status(200).json({ message: 'verified succesfully' })
                } else {
                    const total_price = req.body.quantity * product[0].price
                    console.log(total_price);

                    priceAfterDiscount = total_price - (vendor[0].discount / 100) * total_price
                    console.log(priceAfterDiscount);

                    const payload = {
                        status: req.body.status,
                        verified_by: verify_id,
                        quantity: req.body.quantity,
                        total_price,
                        total_price_discount: priceAfterDiscount
                    }
                    const data = {
                        stock: stock - req.body.quantity
                    }
                    await employeeModel.updateOrderById(id, payload);
                    await employeeModel.updateProduct(order[0].product_id, data)
                    return res.status(200).json({ message: 'verified and updated succesfully' })
                }


            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else if (error.errorCode === 'API_ERROR') {
                    return res.status(409).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    dispatchOrder: async (req, res) => {
        let schema = Joi.object({
            status: Joi.number().min(1).max(10).required()
        })
        let validation = schema.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (validation.error) {
            errorDetails = validation.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: errorDetails })
        }
        else {
            try {
                let { id, dispatch_id } = req.params;
                const order = await employeeModel.getOrderById(id);
                if (order.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'order not found' }
                }
                if (order[0].status != 2) {
                    throw { errorCode: 'API_ERROR', message: 'dispatch team already reacted for this order' }
                }
                const vendor_id = order[0].vendor_id;
                const vendor = await employeeModel.getVendorsByEmpId(vendor_id)
                if (vendor.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'vendor not found' }
                }
                const shipment = await employeeModel.getTeamRoleById(dispatch_id);
                if (shipment.length == 0 || shipment[0].role_id != 8) {
                    throw { errorCode: 'API_ERROR', message: 'invalid dispatch team' }
                }
                const product = await employeeModel.getProductById(order[0].product_id)
                if (product.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'cannot found the product' }
                }
                let payload = {
                    status: req.body.status,
                    shipped_by: dispatch_id
                }
                await employeeModel.updateOrderById(id, payload);
                return res.status(200).json({ message: "shipped successfully" })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else if (error.errorCode === 'API_ERROR') {
                    return res.status(409).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    create_delivery: async (req, res) => {
        try {
            let { group_id } = req.params;
            const orders = await employeeModel.getGroupOrderById(group_id);
            if (orders.length === 0) {
                throw { error: "VALID_ERROR", message: "order details not found" }
            }
            const vendor_id = orders[0].vendor_id
            const vendor = await employeeModel.getVendorById(vendor_id);
            if (vendor.length === 0) {
                throw { error: "VALID_ERROR", message: "vendor not found" }
            }
            const creditDays = vendor[0].credit_days
            let total_price = 0;
            for (i = 0; i < orders.length; i++) {
                const orderData = orders[i];
                // console.log(orderData);

                const { status, total_price_discount } = orderData;
                if (status === 3) {
                    total_price += total_price_discount;
                }
                else {
                    throw { error: "API_ERROR", message: "invalid shipment" }
                }
            }
            // console.log(total_price);
            if (creditDays < 0) {
                let payload = {
                    total_price: total_price,
                    delivery_date: moment().format(),
                    group_id,
                    payment_date: moment().format()
                }
                await employeeModel.addOrderDetails(payload);
            }
            else {
                let payload = {
                    total_price: total_price,
                    delivery_date: moment().format(),
                    group_id
                }
                await employeeModel.addOrderDetails(payload);
            }

            const data = {
                status: 4
            }
            await employeeModel.updateOrderByGroupId(group_id, data)
            return res.status(200).json({
                message: "order has been delievered"
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else if (error.errorCode === 'API_ERROR') {
                return res.status(409).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    payment: async (req, res) => {
        try {
            let { id, vendor_id } = req.params;
            const orders = await employeeModel.getOrderDetailsById(id);
            if (orders.length === 0) {
                throw { errro: 'VALID_ERROR', message: "order details not found" }
            }
            let vendor = await employeeModel.getVendorById(vendor_id);
            if (vendor.length === 0) {
                throw { errro: 'VALID_ERROR', message: "vendor not found" }
            }
            let credit_days = vendor[0].credit_days;

            const paymentDate = req.body.payment_date;
            let startDate = new Date(orders[0].delivery_date);
            // console.log(startDate);

            let endDate = new Date(paymentDate);
            // console.log(endDate);

            let difference = endDate - startDate;
            // console.log(difference);

            const daysTaken = Math.floor(difference / (1000 * 24 * 60 * 60))
            // console.log(daysTaken);


            let payLoad = {
                payment_date: paymentDate,
                days_taken: daysTaken
            }
            let data = {
                credit_days: credit_days - daysTaken
            }
            await employeeModel.addPayOrderDetails(id, payLoad);
            await employeeModel.updateVendorCredit(vendor_id, data);
            return res.status(200).json({
                message: "payment successfull"
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else if (error.errorCode === 'API_ERROR') {
                return res.status(409).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    returnItems: async (req, res) => {
        const schema = Joi.object({
            order_details_id: Joi.number().min(1).required(),
            notes: Joi.string().min(5).max(20).required(),
            return_status: Joi.number().min(1).required(),
            products: Joi.array().items(
                Joi.object({
                    order_id: Joi.number().required(),
                    quantity: Joi.number().required(),
                })
            ).required()
        })
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });
        let errorDetails = [];
        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ data: errorDetails })
        }
        else {
            try {
                let { id } = req.params;
                const vendor = await employeeModel.getVendorById(id);
                if (vendor.length === 0) {
                    throw { error: "VALID_ERROR", message: "vendor not found" }
                }
                console.log(vendor);

                for (i = 0; i < req.body.products.length; i++) {
                    const productData = req.body.products[i];
                    const { order_id, quantity } = productData;
                    const orders = await employeeModel.getOrderById(order_id);
                    if (orders.length == 0) {
                        throw { error: 'VALID_ERROR', message: "order not foudn" }
                    }
                    if (quantity > orders[0].quantity) {
                        throw { error: "VALID_ERROR", message: "return quantity should be less than total quantity" }
                    }
                    let payLoad = {
                        order_id: order_id,
                        vendor_id: id,
                        order_details_id: req.body.order_details_id,
                        quantity: quantity,
                        return_status: req.body.return_status,
                        requested_date: moment().format(),
                        notes: req.body.notes
                    }
                    await employeeModel.addReturnDetails(payLoad);
                }
                return res.status(200).json({
                    message: "return requested"
                })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    verifyReturn: async (req, res) => {
        const schema = Joi.object({
            return_status: Joi.number().min(1).required(),
            dispatch_remarks: Joi.string().min(5).max(20).required(),
        })
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });
        let errorDetails = [];
        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ data: errorDetails })
        }
        else {
            try {
                let { return_id, dispatch_id } = req.params;
                const returnDetails = await employeeModel.getReturnOrderDetails(return_id);
                // console.log(returnDetails);
                if (returnDetails.length === 0) {
                    throw { error: "VALID_ERROR", message: "return details not found" }
                }

                const shipment = await employeeModel.getTeamRoleById(dispatch_id);
                if (shipment.length == 0 || shipment[0].role_id != 8) {
                    throw { errorCode: 'API_ERROR', message: 'invalid dispatch team' }
                }

                const order_id = returnDetails[0].order_id;
                const orders = await employeeModel.getOrderById(order_id);
                // console.log(orders);
                if (orders.length == 0) {
                    throw { error: 'VALID_ERROR', message: "order not foudn" }
                }

                const order_details_id = returnDetails[0].order_details_id;
                const ordersDetails = await employeeModel.getOrderDetailsById(order_details_id);
                // console.log(ordersDetails);
                if (ordersDetails.length == 0) {
                    throw { error: 'VALID_ERROR', message: "orderdetails not found" }
                }

                const product_id = orders[0].product_id;
                const products = await employeeModel.getProductById(product_id);
                // console.log(products);
                if (products.length == 0) {
                    throw { error: 'VALID_ERROR', message: "product not found" }
                }
                if (req.body.return_status === 2) {
                    let newQuantity = orders[0].quantity - returnDetails[0].quantity;
                    let newPrice = orders[0].total_price - (returnDetails[0].quantity * orders[0].price);
                    // console.log(newPrice);
                    let data = {
                        quantity: newQuantity,
                        total_price_discount: newPrice
                    }
                    // console.log(data);

                    let newData = {
                        total_price: ordersDetails[0].total_price - newPrice
                    }
                    // console.log(newData);

                    let newStock = {
                        stock: products[0].stock + returnDetails[0].quantity
                    }
                    // console.log(newStock);

                    let payload = {
                        return_status: req.body.return_status,
                        dispatch_remarks: req.body.dispatch_remarks,
                        aproved_date: moment().format()
                    }
                    await employeeModel.updateOrderById(order_id, data)
                    await employeeModel.updateOrderDetailsById(order_details_id, newData)
                    await employeeModel.updateProduct(product_id, newStock)
                    await employeeModel.updateReturn(return_id, payload)
                }
                else {
                    const payload = {
                        dispatch_remarks: "it seems like dispatch team cancelled your return order",
                        return_status: req.body.status
                    }
                    await employeeModel.updateReturn(return_id, payload)
                }
                return res.status(200).json({
                    message: "dispatcher verified the return"
                })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    getOrders: async (req, res) => {
        try {
            let { vendor_id } = req.params;
            // console.log(vendor_id);

            let offset = req.query.offset && req.query.offset != "undefined" ? parseInt(req.query.offset) : 0;
            let limit = req.query.limit && req.query.limit != "undefined" ? parseInt(req.query.limit) : 10;
            let status = req.query.status && req.query.status != "undefined" ? parseInt(req.query.status) : 10;
            const vendor = await employeeModel.getVendorById(vendor_id);
            if (vendor.length === 0) {
                throw { error: "VALID_ERROR", message: "vendor not found" }
            }
            let totalProducts = await employeeModel.getTotalProducts(vendor_id);
            let products = await employeeModel.getOrdersDetailsByVendorId(offset, limit, status, vendor_id);
            return res.status(200).json({
                message: "details got successfully",
                totalProducts: totalProducts[0].total,
                products
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    addReviews: async (req, res) => {
        const schema = Joi.object({
            rating: Joi.number().required(),
            comment: Joi.string().min(5).max(100).required()
        })
        let validation = schema.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let allErrors = []
        if (validation.error) {
            errorDetails = validation.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: allErrors });
        }
        else {
            try {
                let { vendor_id, product_id } = req.params;
                const vendor = await employeeModel.getVendorById(vendor_id)
                if (vendor.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'vendor not found' }
                }
                const product = await employeeModel.getProductById(product_id)
                if (product.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'product not found' }
                }
                let check = {
                    vendor_id: vendor_id,
                    product_id: product_id
                }
                const vendorOrder = await employeeModel.getOrder(check)
                if (vendorOrder.length == 0) {
                    throw { errorCode: 'API_ERROR', message: 'vendor not purchased this product' }
                }
                const payload = {
                    product_id: product_id,
                    vendor_id: vendor_id,
                    rating: req.body.rating,
                    comment: req.body.comment,
                    created_at: moment().format('YYYY-MM-DD HH:mm:ss')
                }
                await employeeModel.insertReview(payload)
                return res.status(200).json({ message: 'review added succesfully' })

            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else if (error.errorCode === 'API_ERROR') {
                    return res.status(409).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    addCategory: async (req, res) => {
        const schema = Joi.object({
            title_name: Joi.string().min(5).max(20).required(),
            category: Joi.string().min(5).max(20).valid('Minerals', 'Medicines').required(),
        })
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });
        let errorDetails = [];
        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ data: errorDetails })
        }
        else {
            try {
                let { id } = req.params;
                let { title_name, category } = req.body;
                let management = await employeeModel.getManagementById(id);
                if (management.length === 0) {
                    throw { error: "ERROR_CODE", message: "management not found" }
                }
                let payLoad = {
                    management_id: id,
                    title_name,
                    category
                }
                let inserted = await employeeModel.createCategoryItem(payLoad);
                return res.status(201).json({
                    message: "Category item created successfully",
                    id: inserted[0]
                });
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    getCategoryNameById: async (req, res) => {
        try {
            let { id } = req.params;
            const category = await employeeModel.getCategoryById(id);
            if (category.length === 0) {
                throw { error: "VALID_ERROR", message: "category not found" }
            }
            return res.status(200).json({
                message: "Got categories successfully",
                data: category
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    addAdmin: async (req, res) => {
        const schema = Joi.object({
            name: Joi.string().min(5).max(10).required(),
            company_name: Joi.string().min(5).max(50).required(),
            address: Joi.string().min(5).max(50).required(),
            shipping_address: Joi.string().min(5).max(50).required(),
            team_name: Joi.string().min(5).max(50).required(),
            product_category: Joi.string().min(5).max(20).required(),
            GST: Joi.string()
                .min(15)
                .max(15)
                .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
                .required(),
            company_size: Joi.string().valid('small', 'medium', 'large').required(),
        })
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });
        let errorDetails = [];
        // Collect Joi validation errors
        if (validate.error) {
            errorDetails = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ data: errorDetails })
        } else {
            try {
                let { id } = req.params;
                let { name, product_category, company_name, address, shipping_address, team_name, GST, company_size } = req.body;
                let management = await employeeModel.getManagementById(id);
                if (management.length === 0) {
                    throw { error: "VALID_ERROR", message: "management not found" }
                }
                let existingGst = await employeeModel.checkgst(GST);
                if (existingGst.length > 0) {
                    throw { error: "VALID_ERROR", message: "Gst number already exists" }
                }
                let payLoad = {
                    management_id: id,
                    name,
                    product_category,
                    company_name,
                    address,
                    shipping_address,
                    team_name,
                    GST,
                    company_size
                }
                let inserted = await employeeModel.createAdmin(payLoad);
                return res.status(201).json({
                    message: "Category item created successfully",
                    id: inserted[0]
                });
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    addProductsByManagement: async (req, res) => {
        const schema = Joi.object({
            name: Joi.string().min(5).max(20).required(),
            price: Joi.number().positive().required(),
            description: Joi.string().min(5).max(50).required(),
            category: Joi.number().positive().required(),
        })
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
        }
        if (!req.files || req.files.lenght === 0) {
            allErrors.push({
                field: "images",
                message: "atlease one image is required"
            })
        }
        else {
            if (req.files.length > 5) {
                allErrors.push({
                    field: "images",
                    message: "max 5 images are allowed"
                })
            }
        }
        let totalSize = 0;
        for (let i = 0; i < req.files.length; i++) {
            let file = req.files[i];
            const filevalidation = fileValidate(
                file,
                [".jpg", ".jpeg", ".png", ".webp"], 2
            );
            totalSize = totalSize + req.files[i].size;
            if (!filevalidation.valid) {
                allErrors.push({
                    field: `images[${i}]`,
                    message: filevalidation.message
                });
            }
        }
        if (totalSize > 5 * 1024 * 1024) {
            allErrors.push({
                field: `images`,
                message: "total size should not exist 5MB"
            });
        }
        if (allErrors.length > 0) {
            return res.status(422).json({ data: allErrors });
        }
        else {
            try {
                let { id } = req.params;
                let { name, price, description, category } = req.body;
                const management = await employeeModel.getManagementById(id);
                if (management.length === 0) {
                    throw { error: "VALID_ERROR", message: "management not found" }
                }
                let payLoad = {
                    management_id: id,
                    name,
                    price,
                    description,
                    category
                }
                let result = await employeeModel.addProductModel(payLoad);
                let productId = result[0];
                let destFolder = 'ManagaementProducts';
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    await copyFile(file, destFolder)
                        .then(() => { })
                        .catch(() => {
                            throw {
                                errorCode: "API_ERROR",
                                message: "Error uploading product image",
                            };
                        });
                    await deleteFile(file.path);
                    await employeeModel.addProductImage({
                        product_id: productId,
                        image_url: file.filename,
                        mime_type: file.mimetype,
                        created_at: moment().format()
                    });
                }
                return res.status(200).json({
                    message: "category added successfully",
                    data: productId
                })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    getProductByMngId: async (req, res) => {
        try {
            let { id } = req.params;
            const management = await employeeModel.getManagementById(id);
            if (management.length === 0) {
                throw { error: "VALID_ERROR", message: "management not found" }
            }
            let result = await employeeModel.getProductByMngIdModel(id);
            return res.status(200).json({
                data: "get successful",
                data: result
            })
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    createPackage: async (req, res) => {
        const schema = Joi.object({
            category_type: Joi.string().valid('Brand Owner', 'Raw material Supplier').required(),
            size_type: Joi.string().valid('small', 'medium', 'large').required(),
            setup_charge: Joi.number().min(0).required(),
            monthly_basic: Joi.number().min(0).required(),
            monthly_standard: Joi.number().min(0).required(),
            monthly_premium: Joi.number().min(0).required(),
            yearly_basic: Joi.number().min(0).required(),
            yearly_standard: Joi.number().min(0).required(),
            yearly_premium: Joi.number().min(0).required(),
        })
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ data: allErrors })
        }
        else {
            try {
                let { id } = req.params;
                const management = await employeeModel.getManagementById(id);
                if (management.length === 0) {
                    throw { error: "VALID_ERROR", message: "management not found" }
                }
                let payLoad = {
                    management_id: id,
                    category_type: req.body.category_type,
                    size_type: req.body.size_type,
                    setup_charge: req.body.setup_charge,
                    monthly_basic: req.body.monthly_basic,
                    monthly_standard: req.body.monthly_standard,
                    monthly_premium: req.body.monthly_premium,
                    yearly_basic: req.body.yearly_basic,
                    yearly_standard: req.body.yearly_standard,
                    yearly_premium: req.body.yearly_premium
                }
                let result = await employeeModel.managementPackageModel(payLoad);
                return res.status(200).json({
                    message: "packages added successfully",
                    data: result
                })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    getPackages: async (req, res) => {
        try {
            const { id } = req.params;
            let admin = await employeeModel.getpackageByAdmin(id);
            // console.log('DMIN',admin);
            if (admin.length === 0) {
                throw { error: 'VALID_ERROR', message: "admin not found" }
            }
            const category = admin[0].team_name;
            const size = admin[0].company_size;

            const packageData = await employeeModel.getPackageByCategoryAndSize(category, size);
            if (packageData.length === 0) {
                throw { error: 'VALID_ERROR', message: "package not found" }
            }

            return res.status(200).json({
                message: "Package fetched successfully",
                category_type: category,
                size_type: size,
                package: packageData[0],
            });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    updateProductImage: async (req, res) => {
        try {
            const { id } = req.params;
            let allErrors = [];
            const oldImages = await employeeModel.getProductImages(id);
            if (oldImages.length === 0) {
                throw { error: "VALID_ERROR", message: "No images found for this product" }
            }


            if (!req.files || req.files.length === 0) {
                return res.status(422).json({
                    message: "At least one image is required"
                });
            }

            if (req.files.length !== oldImages.length) {
                return res.status(422).json({
                    message: `You must upload exactly ${oldImages.length} images`
                });
            }


            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];

                const valid = fileValidate(
                    file,
                    [".jpg", ".jpeg", ".png", ".webp"],
                    2
                );

                if (!valid.valid) {
                    allErrors.push({
                        field: `images[${i}]`,
                        message: valid.message
                    });
                }
            }

            let totalSize = 0;
            for (let i = 0; i < req.files.length; i++) {
                totalSize += req.files[i].size;
            }

            if (totalSize > 5 * 1024 * 1024) {
                allErrors.push({
                    field: "images",
                    message: "Total images size must not exceed 5MB"
                });
            }

            if (allErrors.length > 0) {
                return res.status(422).json({ message: allErrors });
            }

            const adminFolder = "products";
            const managementFolder = "ManagaementProducts";
            for (let i = 0; i < req.files.length; i++) {
                const newFile = req.files[i];
                // console.log("newFile",newFile)
                const oldImage = oldImages[i];
                // console.log("oldImage",oldImage)
                await copyFile(newFile, adminFolder)
                await copyFile(newFile, managementFolder)
                await deleteFile(newFile.path);
                await deleteFile(`uploads/${adminFolder}/${oldImage.image_url}`)
                await deleteFile(`uploads/${managementFolder}/${oldImage.image_url}`)
                await employeeModel.updateProductImage(oldImage.image_id, {
                    image_url: newFile.filename,
                    mime_type: newFile.mimetype,
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
                });

            }
            return res.status(200).json({
                message: "All images updated successfully"
            });
        } catch (error) {
            if (error.errorCode === 'VALID_ERROR') {
                return res.status(422).json({
                    message: error.message
                })
            } else {
                return res.status(409).json({
                    error: error.message
                })
            }
        }
    },
    updateSingleImage: async (req, res) => {
        let errorDetails = []
        let filevalidation;
        if (req.file) {
            filevalidation = fileValidate(
                req.file,
                [".jpg", ".jpeg", ".png", "webp"],
                2
            );

            if (!filevalidation.valid) {
                errorDetails.push({
                    field: "image",
                    message: filevalidation.message,
                });
            }
        }
        if (!req.file) {
            errorDetails.push({
                field: 'image',
                message: 'Atlest one image is required'
            })
        }
        if (errorDetails.length > 0) {
            return res.status(422).json({ message: errorDetails })
        }
        else {
            try {
                const { image_id } = req.params;
                const oldImage = await employeeModel.getProductImageById(image_id);
                console.log(oldImage);

                if (oldImage.length === 0) {
                    throw { error: "VALID_ERROR", message: "image not found" }
                }
                const adminFolder = 'products';
                const managementFolder = 'ManagaementProducts';
                await copyFile(req.file, adminFolder);
                await copyFile(req.file, managementFolder);
                await deleteFile(req.file.path);
                // console.log("deleting=>>>>>>", `uploads/${adminFolder}/${oldImage[0].image_url}`);
                await deleteFile(`uploads/${adminFolder}/${oldImage[0].image_url}`)
                // console.log("deleting=>>>>>>", `uploads/${adminFolder}/${oldImage[0].image_url}`);

                await deleteFile(`uploads/${managementFolder}/${oldImage[0].image_url}`);
                await employeeModel.updateProductImage(image_id, {
                    image_url: req.file.filename,
                    mime_type: req.file.mimetype,
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
                });
                return res.status(200).json({
                    message: "Image updated successfully",
                    image_id,
                    new_file: req.file.filename
                });
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    createManufacturerTeam: async (req, res) => {
        const schema = Joi.object({
            user_name: Joi.string().min(5).max(8).required(),
            password: Joi.string().min(6).max(10).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#.%*?&])[A-Za-z\d@$!#.%*?&]+$/).required(),
            name: Joi.string().min(3).max(10).required(),
            mobile: Joi.string().min(5).max(10).required(),
            email: Joi.string().email().required(),
            address: Joi.string().min(5).max(20).required(),
            aadhaar: Joi.string().pattern(/^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/).required(),
            pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
            role_id: Joi.number().min(1).required(),
        })
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ data: allErrors })
        }
        else {
            try {
                let { admin_id } = req.params;
                let admin = await employeeModel.getAdminNameByid(admin_id)
                if (admin.length === 0) {
                    throw { error: 'VALID_ERROR', message: "admin not found" }
                }
                let createdByValue;
                if (admin[0].team_name === "Brand Owner") {
                    createdByValue = 1;
                }
                else {
                    createdByValue = 2;
                }
                const existingLogin = await employeeModel.getByUsername(req.body.user_name);


                if (existingLogin.length > 0) {
                    throw { error: 'VALID_ERROR', message: "username already exists." };
                }
                const nameExists = await employeeModel.getName(req.body.name);

                if (nameExists.length > 0) {
                    throw { error: 'VALID_ERROR', message: "name already exists." };
                }
                const checkNumber = await employeeModel.checkNumber(req.body.mobile);

                if (checkNumber.length > 0) {
                    throw { error: 'VALID_ERROR', message: "number already exists." };
                }
                const existingEmail = await employeeModel.getByEmailID(req.body.email);

                if (existingEmail.length > 0) {
                    throw { error: 'VALID_ERROR', message: "Email already exists." };
                }
                const existingPan = await employeeModel.checkpanNumber(req.body.pan);

                if (existingPan.length > 0) {
                    throw { error: 'VALID_ERROR', message: "Pan already exists" }
                }
                const existingAadhaar = await employeeModel.checkAadhaar(req.body.aadhaar)

                if (existingAadhaar.length > 0) {
                    throw { error: 'VALID_ERROR', message: "Aadhaar already exists" }
                }
                const hashedPassword = await bcrypt.hash(req.body.password, 10);


                let payLoad = {
                    admin_id: admin_id,
                    user_name: req.body.user_name,
                    password: hashedPassword,
                    name: req.body.name,
                    mobile: req.body.mobile,
                    email: req.body.email,
                    address: req.body.address,
                    aadhaar: req.body.aadhaar,
                    pan: req.body.pan,
                    role_id: req.body.role_id,
                    created_by: createdByValue
                }
                // console.log(payLoad);
                let result = await employeeModel.uploadManufacturer(payLoad);
                console.log(result);

                return res.status(200).json({
                    message: "posted successfully"
                })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    createProductionTeam: async (req, res) => {
        const schema = Joi.object({
            user_name: Joi.string().min(5).max(8).required(),
            password: Joi.string().min(6).max(10).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#.%*?&])[A-Za-z\d@$!#.%*?&]+$/).required(),
            name: Joi.string().min(3).max(10).required(),
            mobile: Joi.string().min(5).max(10).required(),
            email: Joi.string().email().required(),
            address: Joi.string().min(5).max(20).required(),
            aadhaar: Joi.string().pattern(/^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/).required(),
            pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),

            role_id: Joi.number().min(1).required(),
        })
        // Validate Body
        let validate = schema.validate(req.body, {
            errors: { wrap: { label: false } },
            abortEarly: false
        });

        let allErrors = [];

        // Collect Joi validation errors
        if (validate.error) {
            allErrors = validate.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }));
            return res.status(422).json({ data: allErrors })
        }
        else {
            try {
                let { creator_id } = req.params;
                let creator = await employeeModel.getuserByid(creator_id)
                if (creator.length === 0) {
                    throw { error: 'VALID_ERROR', message: "user not found" }
                }
                const team_type = await employeeModel.getRoleType(creator.role[0].id);
                if (team_type[0].id != 1) {
                    throw { errorCode: 'VALID_ERROR', message: 'only CFO in manufactures can add employee can add employee' }
                }

                // console.log(creator[0]);

                if (creator.role !== 'CFO' && creator.team_type !== 'manufacturerTeam') {
                    throw { error: 'VALID_ERROR', message: "only cfo can create production team" }
                }
                const existingLogin = await employeeModel.getByUsername(req.body.user_name);

                if (existingLogin.length > 0) {
                    throw { error: 'VALID_ERROR', message: "username already exists." };
                }
                const nameExists = await employeeModel.getName(req.body.name);

                if (nameExists.length > 0) {
                    throw { error: 'VALID_ERROR', message: "name already exists." };
                }
                const checkNumber = await employeeModel.checkNumber(req.body.mobile);
                if (checkNumber.length > 0) {
                    throw { error: 'VALID_ERROR', message: "number already exists." };
                }
                const existingEmail = await employeeModel.getByEmailID(req.body.email);
                if (existingEmail.length > 0) {
                    throw { error: 'VALID_ERROR', message: "Email already exists." };
                }
                const existingPan = await employeeModel.checkpanNumber(req.body.pan);

                if (existingPan.length > 0) {
                    throw { error: 'VALID_ERROR', message: "Pan already exists" }
                }
                const existingAadhaar = await employeeModel.checkAadhaar(req.body.aadhaar)
                if (existingAadhaar.length > 0) {
                    throw { error: 'VALID_ERROR', message: "Aadhaar already exists" }
                }
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                let payLoad = {
                    manufacture_id: creator_id,
                    user_name: req.body.user_name,
                    password: hashedPassword,
                    name: req.body.name,
                    mobile: req.body.mobile,
                    email: req.body.email,
                    address: req.body.address,
                    aadhaar: req.body.aadhaar,
                    pan: req.body.pan,
                    role_id: req.body.role_id,
                    created_by: 2
                }

                await employeeModel.uploadManufacturer(payLoad);
                return res.status(200).json({
                    message: "posted successfully"
                })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    },
    createBrandOwnerByManufacture: async (req, res) => {
        let formvalidation = Joi.object({
            name: Joi.string().min(1).max(255).required(),
            company_name: Joi.string().min(1).max(100).required(),
            company_size: Joi.string().min(1).max(250).valid('small', 'medium', 'large').required(),
            address: Joi.string().min(1).max(150).required(),
            GST: Joi.string().min(1).max(100).alphanum().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required(),
            shipping_address: Joi.string().min(1).max(150).required(),
            product_category: Joi.number().integer().required()
        })
        let validation = formvalidation.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (validation.error) {
            errorDetails = validation.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
            return res.status(422).json({ data: errorDetails })
        } else {
            try {
                let { id } = req.params
                let manufacture = await employeeModel.getManufacture(id)
                if (manufacture.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'manufacture not found' }
                }
                const checkGST = await employeeModel.checkgst(req.body.GST)
                if (checkGST.length > 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'gst number alredy exist' }
                }
                const payload = {
                    name: req.body.name,
                    team_name: 'Brand owner',
                    company_name: req.body.company_name,
                    company_size: req.body.company_size,
                    address: req.body.address,
                    gst: req.body.GST,
                    shipping_address: req.body.shipping_address,
                    product_category: req.body.product_category,
                    manufacture_id: id
                }
                await employeeModel.createAdmin(payload)
                return res.status(200).json({ message: 'Brand owner added succesfully' })
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                }
                else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }

    },
    createManufactureProduct: async (req, res) => {
        let formvalidation = Joi.object({
            name: Joi.string().min(1).max(255).required(),
            type: Joi.number().integer().min(1).required(),
            productDescription: Joi.string().min(1).max(150).required(),
            price: Joi.number().min(1).required(),
            applicableTo: Joi.number().integer().valid(1, 2).required()
        })
        let validation = formvalidation.validate(req.body, { errors: { wrap: { label: false } }, abortEarly: false })
        let errorDetails = []
        if (validation.error) {
            errorDetails = validation.error.details.map(err => ({
                field: err.context.key,
                message: err.message
            }))
        }
        if (!req.files || req.files.length == 0) {
            errorDetails.push({
                field: 'image',
                message: 'Atlest one image is required'
            })
        } else {
            let filevalidation;
            let totalSize = 0;
            for (let i = 0; i < req.files.length; i++) {
                filevalidation = fileValidate(req.files[i], [".jpg", ".jpeg", ".png", ".webp"], 2)
                console.log(filevalidation);
                totalSize += req.files[i].size
                if (!filevalidation.valid) {
                    errorDetails.push({
                        field: 'image',
                        message: filevalidation.message
                    })
                }
            }
            if (totalSize > 5 * 1024 * 1024) {
                errorDetails.push({
                    field: "product_image",
                    message: "Images size should not exceed 5MB"
                });
            }
        }
        if (errorDetails.length > 0) {
            return res.status(422).json({ message: errorDetails })
        }
        else {
            try {
                let { id } = req.params
                let manufacture = await employeeModel.getManufacture(id)

                if (manufacture.length == 0) {
                    throw { errorCode: 'VALID_ERROR', message: 'manufacture not found' }
                }
                const payload = {
                    name: req.body.name,
                    category: req.body.type,
                    description: req.body.productDescription,
                    manufacture_id: id,
                    created_by: 2,
                    price: req.body.price,
                    applicable_to: req.body.applicableTo,
                    created_at: moment().format('YYYY-MM-DD HH:mm:ss')
                }
                let result = []
                const product = await employeeModel.addProductModel(payload)
                if (req.files) {
                    for (let i = 0; i < req.files.length; i++) {
                        const item = req.files[i]
                        const payload = {
                            image_url: item.filename,
                            image_type: item.mimetype,
                            created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                            product_id: product
                        }
                        let destFolder = 'ManagaementProducts';
                        await copyFile(req.files[i], destFolder)
                        const product_image = await empmodels.addProductImage(payload)
                        result.push(payload)
                    }
                    return res.status(200).json({ message: 'product added succesfully' })
                }
            } catch (error) {
                if (error.errorCode === 'VALID_ERROR') {
                    return res.status(422).json({
                        message: error.message
                    })
                } else {
                    return res.status(409).json({
                        error: error.message
                    })
                }
            }
        }
    }

}
module.exports = employeeController;