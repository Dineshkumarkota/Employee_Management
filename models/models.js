let db = require("../config/mysqldb");
let employeeModel = {
  getByEmail: async (email, trx = null) => {
    const knex = trx || db;
    try {
      let result = knex("employees")
      result.where("email", email)
      result.select('name')
      result.limit(1);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  checkPan: async (pan, trx = null) => {
    const knex = trx || db;
    try {
      let result = knex("employees");
      result.where("pan_number", pan);
      result.select('name')
      result.limit(1);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  getByLoginId: async (login_id, trx = null) => {
    const knex = trx || db;
    try {
      let result = knex("employees");
      result.where("login_id", login_id);
      result.select('name')
      result.limit(1);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  getByNumber: async (number, trx = null) => {
    const knex = trx || db;
    try {
      let result = knex("employees");
      result.where("phone", number);
      result.select('name')
      result.limit(1);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  postEmployeeById: async (data, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      let result = await knex("employees").insert(data);
      return result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },

  getEmployeeModel: async (trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      let empData = [
        "employee_id",
        "name",
        "email",
        "phone",
        "address",
        "location",
        "role",
        "designation",
        "salary",
        "previous_experience",
        "joining_date",
        "sales_target",
        "commission",
        "TA",
        "DA",
        "login_id",
        "password",
        'file_url'
      ];
      let result = knex("employees");
      result.select(empData);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  loginValidation: async (login_id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      let result = knex("employees");
      result.where("login_id", login_id);
      result.select("password");
      result.limit(1);
      let row = await result;
      return row[0];
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  findUserByUsername: async (username, trx = null) => {
    const knex = trx || db;
    try {
      let result = knex("employees");
      result.where("login_id", username);
      result.select(
        "employee_id",
        "name",
        "login_id",
        "failed_attempts",
        "last_failed_attempt",
        "role",
        "password"
      );
      result.limit(1);
      const row = await result;
      return row[0];
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  getSecurityQuestionsForUser: async (employeeId, trx = null) => {
    try {
      const knex = trx || db;
      let result = knex("employee_security_answers as esa");
      result.join("security_questions as sq", "esa.qid", "sq.qid");
      result.select("sq.qid", "sq.question");
      result.where("esa.employee_id", employeeId);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  getUserAnswers: async (employee_id, trx = null) => {
    try {
      const knex = trx || db;
      let result = knex("employee_security_answers");
      result.select("qid", "answer");
      result.where("employee_id", employee_id);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  checkContact: async (contact, trx = null) => {
    try {
      const knex = trx || db;
      const result = knex("employees")
      result.select("employee_id", "name", "phone")
      result.where("phone", contact);
      return result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: error.message,
      };
    }
  },
  updatePassword: async (username, hashedPassword, trx = null) => {
    try {
      const knex = trx || db;
      let result = knex("employees");
      result.where("login_id", username);
      result.update({ password: hashedPassword });
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  resetFailedAttempts: async (employee_id, trx = null) => {
    try {
      const knex = trx || db;
      let result = knex("employees");
      result.where("employee_id", employee_id);
      result.update({ failed_attempts: 0, last_failed_attempt: null });
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  increaseFailedAttempts: async (employee_id, last, trx = null) => {
    try {
      const knex = trx || db;
      let result = knex("employees");
      result.where("employee_id", employee_id);
      result.increment("failed_attempts", 1);
      result.update({ last_failed_attempt: last });
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  createQuestion: async (que, trx = null) => {
    try {
      const knex = trx || db;
      let result = knex("security_questions");
      result.insert({ question: que });
      return await result;
    } catch (error) {
      throw { errorCode: "DB_Error", message: error.message };
    }
  },
  updateQuestion: async (que, id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      let result = knex("security_questions");
      result.where("qid", id);
      result.update({ question: que });
      return await result;
    } catch (error) {
      throw { errorCode: "DB_Error", message: error.message };
    }
  },
  // getQuestionById:async(id,trx=null)=>{
  //       let knex=trx!=null?trx:db;
  //       try {
  //          let result=knex('security_questions')
  //          result.select('id','question')
  //          result.where('id',id)
  //          return await result
  //       } catch (error) {
  //          throw {errorCode:'DB_Error',message:error.message}
  //       }
  // },
  getQuestionById: async (id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      let result = knex("security_questions");
      result.select("qid", "question");
      result.where("qid", id);
      return await result;
    } catch (error) {
      throw { errorCode: "DB_Error", message: error.message };
    }
  },
  getAllQuestions: async (trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      let result = knex("security_questions");
      result.select("qid", "question");
      return await result;
    } catch (error) {
      throw { errorCode: "DB_Error", message: error.message };
    }
  },
  deleteQuestion: async (id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      let result = knex("security_questions");
      result.where("qid", id);
      result.del();
      return await result;
    } catch (error) {
      throw { errorCode: "DB_Error", message: error.message };
    }
  },
  updateProfile: async (data, id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      let result = knex("employees");
      result.where("employee_id", id);
      result.update(data);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  saveEmployeeImage: async (id, data, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("employees");
      result.where('employee_id', id)
      result.update(data);
      return await result;
    } catch (error) {
      console.error("DB Error (saveEmployeeImage):", error);
      throw { errorCode: "DB_ERROR", message: "Error saving employee image" };
    }
  },
  getEmployeeById: async (id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("employees");
      result.select('file_url', 'employee_id', 'name', "email", "phone", "address", "remaining_leaves", "leaves_taken", 'checks_upload', 'role_id')
      result.where("employee_id", id);
      result.limit(1);
      return await result
    } catch (error) {
      console.error("DB Error :", error);
      throw { errorCode: "DB_Error", message: error.message };
    }

  },
  updateEmployeeImage: async (employee_id, data, trx = null) => {
    try {
      let knex = trx != null ? trx : db;
      const result = knex("employees")
      result.where("employee_id", employee_id)
      result.update(data);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  getAttendanceByDate: async (employee_id, work_date, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("attendance")
      result.where({ employee_id, work_date })
      result.limit(1)
      let row = await result;
      return await row[0];
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  createAttendance: async (data, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("attendance")
      result.insert(data);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  updateAttendance: async (employee_id, work_date, data, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("attendance")
      result.where({ employee_id, work_date })
      result.update(data)
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  createLeaveRequest: async (data, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("leave_requests")
      result.insert(data)
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  getLeaveById: async (leave_id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex('leave_requests')
      result.where('leave_id', leave_id)
      result.limit(1)
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  updateLeaveStatus: async (leave_id, payload, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex('leave_requests')
      result.where('leave_id', leave_id)
      result.update(payload)
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  updateEmployeeLeaves: async (employeeId, payload, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("employees")
      result.where("employee_id", employeeId)
      result.update(payload);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  getVendorEmail: async (email, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("vendors")
      result.where("email", email)
      result.limit(1)
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  getVendorNumber: async (mobile, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex("vendors")
      result.where("mobile", mobile)
      result.limit(1)
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }
  },
  updateVendor: async (data, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex('vendors')
      result.insert(data);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  getVendorsByEmpId: async (id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex('vendors')
      result.where('employee_id', id);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  getVendors: async (trx = null) => {
    let knex = trx != null ? trx : db;
    let selectedData = ['vendor_id', "employee_id", "organisation_name", "vendor_name", 'location', 'mobile', 'email']
    try {
      const result = knex('vendors')
      result.select(selectedData);
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  },
  getEmployeeRoleLevel: async (id, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex('employees')
      result.where('role_id', id)
      result.select("employee_id", "name", "email", "phone", "role_id");
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      }
    }
  },
  getHigherRoles: async (currentLevel, trx = null) => {
    let knex = trx != null ? trx : db;
    try {
      const result = knex('roles')
      result.select('role_id',"role_name")
      result.where('role_id', ">", currentLevel)
      result.orderBy('role_id', "asc")
      return await result;
    } catch (error) {
      throw {
        errorCode: "DB_ERROR",
        message: "Error occurred while executing",
      };
    }

  }

};
module.exports = employeeModel;
