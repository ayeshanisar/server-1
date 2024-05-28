const express = require('express')
const router = express.Router();
const User = require("../models/userSchema");
const Course = require("../models/courseSchema");
const Schedule = require("../models/scheduleSchema");
const bcrypt = require('bcryptjs');
const RegisteredCourse = require("../models/registeredCourseSchema");
const Attendance = require("../models/attendanceSchema");
// const imageTesting = require("../assets/imgs/test.jpg");
const fs = require('fs');
const path = require('path');
const request = require('request');
const multer = require('multer');

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

const authenticate = require("../middlewares/authenticate");

router.get('/', (req, res)=>{
    res.send("Hello from router server home page");
});

router.get('/testing', (req, res)=>{
    res.send("Testing API");
})

const validateEmail = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
};

router.post('/api/v1/register', upload.single('profilePicture'),(req, res) => {
    const { role, fullname, email, registration, batchNo, department, password, confirmPassword} = req.body;
    let profilePicture = req.file;
    console.log(fullname, password, confirmPassword, email, registration, batchNo, department);
    if (!fullname || !password || !confirmPassword || !email || !registration || !batchNo || !department) {
        return res.status(422).json({ error: "Please fill in all fields." });
    }

    console.log(profilePicture);

    if (!validateEmail(email)) {
        return res.status(422).json({ error: "Please enter a valid email address." });
    }

    if (password.length < 8) {
        return res.status(422).json({ error: "Password must be at least 8 characters long." });
    }

    if (password !== confirmPassword) {
        return res.status(422).json({ error: "Passwords do not match." });
    }

    const registrationNo = registration;

    User.findOne({ $or: [{ email: email }, { registrationNo: registrationNo }], 
        registrationNo: { $ne: '0' } })
        .then((userExist) => {
            if (userExist) {
                return res.status(422).json({ error: "Email or registration number already registered." });
            }
            profilePicture = profilePicture.originalname;
            const newUser = new User({ fullname, email, registrationNo, batchNo, department, password, role,  profilePicture});

            newUser.save()
                .then(() => {
                    res.status(201).json({ message: "Successfully registered." });
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({ error: "User not registered." });
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: "Internal server error." });
        });
});


router.post('/api/v1/signin', async (req, res) => {
    const { role, registration, password } = req.body;

    if (!role || !registration || !password) {
        return res.status(422).json({ error: "Please provide role, registration, and password." });
    }

    try {
        let user;
        if (role === "student") {
            user = await User.findOne({ registrationNo: registration });
            if (!user) {
                return res.status(404).json({ error: "Student not found." });
            }
        } else if (role === "teacher") {
            user = await User.findOne({ email: registration });
            if (!user) {
                return res.status(404).json({ error: "Teacher not found." });
            }
        } else if (role === "manager") {
            if (registration !== "ahmedraza") {
                return res.status(401).json({ error: "Invalid username" });
            }
            if (password !== '12345678') {
                return res.status(401).json({ error: "Invalid password" });
            }
            return res.status(200).json({ message: "Successfully logged in" });
        } else {
            return res.status(400).json({ error: "Invalid role." });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal server error" });
            }
            if (isMatch) {
                return res.status(200).json({ message: "Successfully logged in", user: user._id });
            } else {
                return res.status(401).json({ error: "Invalid password." });
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});



router.get('/getUser', authenticate, (req, res, next) => {
    console.log("GET REQUEST");
    res.send(req.currentUser);
  });

  router.get('/api/v1/courses', async (req, res) => {
    try {
        const courses = await Course.find().populate('assignedTeacher', 'fullname');

        res.status(200).json({ courses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get('/api/v1/users', async (req, res) => {
    const { role } = req.query;

    try {
        const users = await User.find({ role });
        res.status(200).json({ teachers: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/api/v1/addNewCourse', async (req, res) => {
    try {
        const { courseCode, courseName, assignedTeacher, assignedClass } = req.body;

        const newCourse = new Course({
            courseCode,
            courseName,
            assignedTeacher,
            assignedClass
        });

        await newCourse.save();

        res.status(201).json({ message: 'New course added successfully' });
    } catch (error) {
        console.error('Error adding new course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/api/v1/users/:teacherId', async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        const user = await User.findById(teacherId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const teacherFullName = user.fullname;
        res.status(200).json({ teacherFullName });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/api/v1/courses/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.status(200).json({ course });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/api/v1/updateCourse/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { courseCode, courseName, assignedTeacher,assignedClass } = req.body;

        const updatedCourse = await Course.findByIdAndUpdate(courseId, {
            courseCode,
            courseName,
            assignedTeacher,
            assignedClass
        }, { new: true });

        if (!updatedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(200).json({ updatedCourse });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/v1/schedule', async (req, res) => {
    try {
        const scheduleData = req.body;
        const scheduleEntries = [];
        for (const day of Object.keys(scheduleData)) {
            const daySchedule = scheduleData[day];
            for (const slot of Object.keys(daySchedule)) {
                const { teacher, class: className } = daySchedule[slot];
                const slotData = {
                    day,
                    slot,
                    teacher,
                    class: className
                };
                scheduleEntries.push(slotData);
            }
        }
        await Schedule.insertMany(scheduleEntries);

        res.status(201).json({ message: 'Schedule saved successfully' });
    } catch (error) {
        console.error('Error saving schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/api/v1/getSchedule', async (req, res) => {
    try {
        const schedule = await Schedule.find();
        res.status(201).json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/v1/student/register-course', async (req, res) => {
    try {
        const { course, user} = req.body;
        const newRegistration = new RegisteredCourse({
            user: user,
            course: course,
            attendance: 0, 
        });
        await newRegistration.save();
        res.status(201).json({ message: 'Course registered successfully' });
    } catch (error) {
        console.error('Error registering course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/api/v1/student/:userId/registered-courses', async (req, res) => {
    const userId = req.params.userId;

    try {
        const registeredCourses = await RegisteredCourse.find({ user: userId })
            .populate({
                path: 'course',
                populate: {
                    path: 'assignedTeacher',
                    model: 'USER'
                }
            });

        res.status(200).json({ registeredCourses });
    } catch (error) {
        console.error("Error fetching registered courses:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/api/v1/teacher/:userId/assigned-courses', async (req, res) => {
    const userId = req.params.userId;

    try {
        const teacher = await User.findById(userId);

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found." });
        }

        const assignedCourses = await Course.find({ assignedTeacher: userId });

        res.status(200).json({ assignedCourses });
    } catch (error) {
        console.error("Error fetching assigned courses:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/api/v1/course/:courseId/students', async (req, res) => {
    const courseId = req.params.courseId;

    try {
        const registeredStudents = await RegisteredCourse.find({ course: courseId }).populate('user');
        console.log(registeredStudents);
        const students = registeredStudents.map(registeredStudent => ({
            _id: registeredStudent.user._id,
            name: registeredStudent.user.fullname,
            attendance: registeredStudent.attendance
        }));

        res.status(200).json({ students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/api/v1/teacher/:userId/timetable', async (req, res) => {
    const userId = req.params.userId;

    try {
        const scheduleData = await Schedule.find({ teacher: userId }).select('day slot');

        const courseData = await Course.find({ assignedTeacher: userId }).select('courseCode courseName');

        const timetableData = scheduleData.map(schedule => {
            const { day, slot } = schedule;
            const course = courseData.find(course => course.assignedClass === schedule.class);
            return {
                day,
                slot,
                courseCode: course ? course.courseCode : '',
                courseName: course ? course.courseName : ''
            };
        });

        res.status(200).json({ schedule: timetableData });
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/v1/course/:courseId/attendance', async (req, res) => {
    try {
        const { lectureNo, slotTime, weekday, attendance } = req.body;
        console.log("Attendance:", attendance);
        const courseId = req.params.courseId;

        for (const entry of attendance) {
            const { studentId, present } = entry;
            console.log(entry);
            await Attendance.create({
                user: studentId,
                course: courseId,
                lectureNo: lectureNo,
                slot: slotTime,
                weekday: weekday,
                attendance: present
            });
            if (present === 1) {
                await RegisteredCourse.findOneAndUpdate(
                    { user: studentId, course: courseId },
                    { $inc: { attendance: 1 } }
                );
            }
        }

        res.status(200).json({ message: 'Attendance saved successfully' });
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).json({ error: 'Failed to save attendance' });
    }
});

router.get('/api/v1/attendance', async (req, res) => {
    try {
        const imagePath = path.join(__dirname, 'test.jpg');
        const imageData = fs.readFileSync(imagePath);

        const options = {
            url: 'https://ffe2-39-43-133-114.ngrok-free.app/mark_attendance',
            method: 'POST',
            formData: {
                image: {
                    value: imageData,
                    options: {
                        filename: 'test.jpg',
                        contentType: 'image/jpeg'
                    }
                }
            }
        };
        request(options, async (error, response, body) => {
            if (error) {
                console.error('Error saving attendance:', error);
                res.status(500).json({ error: 'Failed to save attendance' });
            } else {
                console.log('Attendance Data:', body);
                try {
                    const attendance = body.split('').map(Number); 
                    const newAttendance = new Attendance({
                        user: "660a8311c5c113cfc424c7cc", 
                        course: "660a8356c5c113cfc424c7f4", 
                        lectureNo: 1, 
                        slot: "08:30", 
                        weekday: "Wednesday",
                        attendance: attendance 
                    });
                    await newAttendance.save();
                    res.json({ message: 'Attendance saved successfully' });
                } catch (err) {
                    console.error('Error saving attendance:', err);
                    res.status(500).json({ error: 'Failed to save attendance' });
                }
            }
        });
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).json({ error: 'Failed to save attendance' });
    }
});

const checkStudentInClass = async () => {
    try {
        // const imageData = req.body.image;
        const imagePath = path.join(__dirname, 'test.jpg');
        const imageData = fs.readFileSync(imagePath);

        const options = {
            url: 'https://ffe2-39-43-133-114.ngrok-free.app/check_student',
            method: 'POST',
            formData: {
                image: {
                    value: imageData,
                    options: {
                        filename: 't.jpg',
                        contentType: 'image/jpeg'
                    }
                }
            }
        };
        // console.log(imageData);
        // const formData = new FormData();
        // formData.append("image", imageData);
        // const imageUrl = '/assets/imgs/test.jpg'; // Replace this with your image URL
        // const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        // formData.append('image', response.data, { filename: 'test.jpg' });
        request(options, (error, response, body) => {
            if (error) {
                console.error('Error saving attendance:', error);
                // res.status(500).json({ error: 'Failed to save attendance' });
            } else {
                console.log('Attendance Data:', body);
                // res.json(body);
            }
        });
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).json({ error: 'Failed to save attendance' });
    }
};

// callAPI();

// setInterval(checkStudentInClass, 10000);

module.exports = router;