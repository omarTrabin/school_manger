import dbFun from "../model/dbFun.js";
import sendGmail from "../model/gmail.js";
import express from "express";
import bcrypt from "bcryptjs";
import moment from "moment";
import authenticate, { isManagement, isTeacher } from './auth.js'; // ייבוא פונקציות האימות
import crypto from 'crypto';

function generateRandomCode(length = 8) {
  return crypto.randomInt(10000000, 99999999).toString(); // توليد كود عشوائي مكون من 8 أرقام
}
const router = express.Router();


router.use(authenticate); // הוספת אימות לכל הפעולות
router.use(isManagement); // ווידוא שהמשתמש הוא מנהל

router.get('/', async (req, res) => {
  res.render("Management/index");
});

router.post('/addstudint', async (req, res) => {
  const { firstName, phone, email, id, password } = req.body;
 console.log('yas1')
  // בדיקה אם יש משתמש עם אותו אימייל או שם
  const checkQuery = `SELECT * FROM USERS WHERE USER_NAME = '${email}' OR USER_NAME = '${firstName}'`;
  const existingUsers = await dbFun.get_data(checkQuery);
  
  if (existingUsers.length > 0) {
    return res.status(400).json({ error: 'משתמש עם אותו אימייל או שם כבר קיים' });
  }
  console.log('yas2')
  // בדיקה אם ID חוקי
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID לא חוקי' });
  }


  const query = `INSERT INTO STUDENT (NAME_STUDENT, phone, email, ID_)
    VALUES ('${firstName}', ${phone}, '${email}', ${id})`;
  const userQuery = `INSERT INTO USERS (ID_STUDENT, ID_TEACHER, USER_NAME, PASSWORD, USER_TYPE)
    VALUES (${id}, NULL, '${email}', '${generateRandomCode()}', 'STUDENT')`;
  await sendGmail('55',email);
  console.log('yas3')
 // await dbFun.updateData(query);
 // await dbFun.updateData(userQuery);
  //await sendGmail("1234",email)
  res.status(200).json({ firstName, phone, email, id });
});

router.post('/addTeacher', async (req, res) => {
  const { teacherName, teacherEmail, teacherPhone, teacherAddress, id } = req.body;
  
  // בדיקה אם יש משתמש עם אותו אימייל או שם
  const checkQuery = `SELECT * FROM USERS WHERE USER_NAME = '${teacherEmail}' OR USER_NAME = '${teacherName}'`;
  const existingUsers = await dbFun.get_data(checkQuery);
  
  if (existingUsers.length > 0) {
    return res.status(400).json({ error: 'משתמש עם אותו אימייל או שם כבר קיים' });
  }

  // בדיקה אם ID חוקי
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID לא חוקי' });
  }

  const query_TEACHER = `INSERT INTO TEACHER (NAME_TEACHER, GMAIL, Phone, ADDRESS, ID_)
    VALUES ('${teacherName}', '${teacherEmail}', ${teacherPhone}, '${teacherAddress}', ${id})`;

  await dbFun.updateData(query_TEACHER);

  const userQuery = `INSERT INTO USERS (ID_STUDENT, ID_TEACHER, USER_NAME, PASSWORD, USER_TYPE)
    VALUES (NULL, ${id}, '${teacherEmail}', '${generateRandomCode()}', 'TEACHER')`;

  await dbFun.updateData(userQuery);

  res.status(200).json({ teacherName, teacherEmail, teacherPhone, teacherAddress, id });
});

router.post('/addManagement', async (req, res) => {
  const { firstName, phone, email, id } = req.body;

  // בדיקה אם יש משתמש עם אותו אימייל או שם
  const checkQuery = `SELECT * FROM USERS WHERE USER_NAME = '${email}' OR USER_NAME = '${firstName}'`;
  const existingUsers = await dbFun.get_data(checkQuery);
  
  if (existingUsers.length > 0) {
    return res.status(400).json({ error: 'משתמש עם אותו אימייל או שם כבר קיים' });
  }

  // בדיקה אם ID חוקי
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID לא חוקי' });
  }


  const userQuery = `INSERT INTO USERS (ID_STUDENT, ID_TEACHER, USER_NAME, PASSWORD, USER_TYPE)
    VALUES (${id}, NULL, '${email}', '${generateRandomCode()}', 'Management')`;

  await dbFun.updateData(userQuery);
  res.status(200).json();
});

router.get('/add-course', async (req, res) => {
  try {
    const query_TEACHER = "SELECT * FROM TEACHER";
    const teachers = await dbFun.get_data(query_TEACHER);

    if (teachers) {
      res.render("Management/add-course", { teachers });
    } else {
      res.render("Management/add-course", { teachers: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post('/addCorse', async (req, res) => {
  try {
    const { courseName, information, startDate, startTime, endDate, endTime, teacherSelect } = req.body;

    if (!courseName || !information || !startDate || !startTime || !endDate || !endTime || !teacherSelect) {
      return res.status(400).json({ error: 'יש למלא את כל השדות הנדרשים' });
    }

    const userQuery = `
      INSERT INTO COURSE (Name_Course, infromation, start_date, start_time, end_date, end_time, ID_TEACHER)
      VALUES ('${courseName}', '${information}', '${startDate}', '${startTime}', '${endDate}', '${endTime}', ${teacherSelect})
    `;

    await dbFun.updateData(userQuery);
    res.status(200).json({ courseName, information, startDate, startTime, endDate, endTime });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/add-Teacher', (req, res) => {
  res.render("Management/add_teacher");
});

router.get('/student', (req, res) => {
  res.render('Management/add_student');
});

router.get('/add-class', (req, res) => {
  res.render("Management/add_class");
});

router.post('/addclass', async (req, res) => {
  const { CLASS_NAME, TAYP, SEAT_NUMBER } = req.body;

  const classQuery = `INSERT INTO class (CLASS_NAME, TAYP, SEAT_NUMBER)
    VALUES ('${CLASS_NAME}', '${TAYP}', ${SEAT_NUMBER})`;

  await dbFun.updateData(classQuery);
  res.status(200).json({ CLASS_NAME, TAYP, SEAT_NUMBER });
});

router.post('/addclassWithCuorse', async (req, res) => {
  const { ID_COURSE, ID_CLASS, start_date, start_time, end_time } = req.body;

  const add = `INSERT INTO CLASS_MANAGEMENT (ID_COURSE, ID_CLASS, start_date, start_time, end_time)
    VALUES (${ID_COURSE}, ${ID_CLASS}, '${start_date}', '${start_time}', '${end_time}')`;

  await dbFun.updateData(add);

  const CurseQuery = `SELECT * FROM COURSE WHERE ID_COURSE = ${ID_COURSE}`;
  const course = await dbFun.get_data(CurseQuery);
  const date = moment(start_date);

  const startDate = moment(course[0].start_date);
  const endDate = moment(course[0].end_date);

  let currentDate = startDate.clone();
  while (currentDate.isSameOrBefore(endDate)) {
    if (currentDate.day() === date.day()) {
      const LESSON_DATE = currentDate.format('YYYY-MM-DD');
      const lessonQuery = `INSERT INTO LESSON (ID_COURSE, HOMEWORKLBL, HOMEWORKBDF, LESSON_CONTENT, LESSON_DATA, LESSON_DATE, start_time, end_time)
        VALUES (${ID_COURSE}, NULL, NULL, NULL, NULL, '${LESSON_DATE}', '${start_time}', '${end_time}')`;
      await dbFun.updateData(lessonQuery);
    }
    currentDate.add(1, 'day');
  }

  res.status(200).json();
});

router.get('/Education_date', async (req, res) => {
  try {
    const query_class = "SELECT * FROM CLASS";
    const classes = await dbFun.get_data(query_class);
    const query_course = "SELECT * FROM COURSE";
    const courses = await dbFun.get_data(query_course);

    if (classes && courses) {
      res.render("Management/Education_date", { classes, courses });
    } else {
      res.render("Management/Education_date", { classes: [], courses: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/register-student-course', async (req, res) => {
  try {
    const query_course = "SELECT * FROM COURSE";
    const courses = await dbFun.get_data(query_course);
    const query_student = "SELECT * FROM STUDENT";
    const students = await dbFun.get_data(query_student);

    res.render('Management/register_student_course', { courses, students });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post('/register-student-course', async (req, res) => {
  let { studentIds, courseId } = req.body;
  
  // Ensure studentIds is an array
  if (!Array.isArray(studentIds)) {
    studentIds = [studentIds];
  }
  
  try {
    const promises = studentIds.map(studentId => {
      const query = `INSERT INTO REGISTRATION_FOR_COURSE (ID_STUDENT, ID_COURSE) VALUES (${studentId}, ${courseId})`;
      return dbFun.updateData(query);
    });

    await Promise.all(promises);
    res.status(200).json({ message: "Students registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// פונקציה לניקוי משתמשים כפול\ים ב-Management.js
router.get('/clean-duplicate-users', async (req, res) => {
  try {
    const usersQuery = `SELECT * FROM USERS ORDER BY ID_USERS`;
    const users = await dbFun.get_data(usersQuery);

    const seenEmails = new Set();
    const seenNames = new Set();
    const deleteIds = [];

    for (const user of users) {
      if (seenEmails.has(user.USER_NAME) || seenNames.has(user.USER_NAME)) {
        deleteIds.push(user.ID_USERS);
      } else {
        seenEmails.add(user.USER_NAME);
        seenNames.add(user.USER_NAME);
      }
    }

    if (deleteIds.length > 0) {
      const deleteQuery = `DELETE FROM USERS WHERE ID_USERS IN (${deleteIds.join(", ")})`;
      await dbFun.updateData(deleteQuery);
    }

    res.status(200).json({ message: 'Duplicate users cleaned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/course/:id', async (req, res) => {
  const courseId = req.params.id;
  try {
    const courseQuery = `SELECT * FROM COURSE WHERE ID_COURSE = ${courseId}`;
    const homeworksQuery = `SELECT * FROM HOMEWORK WHERE ID_COURSE = ${courseId}`;
    const materialsQuery = `SELECT * FROM MATERIAL WHERE ID_COURSE = ${courseId}`;

    const course = await dbFun.get_data(courseQuery);
    const homeworks = await dbFun.get_data(homeworksQuery);
    const materials = await dbFun.get_data(materialsQuery);

    res.render("course", { course: course[0], homeworks, materials });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Teacher routes
const teacherRouter = express.Router();

teacherRouter.use(isTeacher);

teacherRouter.get('/', async (req, res) => {
  const teacherId = req.session.user.ID_TEACHER;
  try {
    const studentsQuery = `SELECT * FROM STUDENT`;
    const coursesQuery = `SELECT * FROM COURSE WHERE ID_TEACHER = ${teacherId}`;
    
    const students = await dbFun.get_data(studentsQuery);
    const courses = await dbFun.get_data(coursesQuery);

    res.render("teacher", { teacherName: req.session.user.NAME_TEACHER, students, courses });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

teacherRouter.post('/upload-material', async (req, res) => {
  const { courseId } = req.body;
  const file = req.file;
  try {
    const query = `INSERT INTO MATERIAL (ID_COURSE, FILE_NAME) VALUES (${courseId}, '${file.filename}')`;
    await dbFun.updateData(query);
    res.status(200).redirect('/teacher');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.use('/teacher', teacherRouter);

export default router;
