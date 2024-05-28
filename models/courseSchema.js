const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    assignedTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
        required: true
    },
    courseCode:{
        type: String,
        required:true
    },
    courseName:{
        type: String,
        required:true
    },
    assignedClass:{
        type: String,
        required:true
    }
})





const CourseSchema = mongoose.model("COURSE", courseSchema);

module.exports = CourseSchema;

