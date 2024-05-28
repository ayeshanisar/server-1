const mongoose = require('mongoose');
const User = require('../models/userSchema');

const registeredCourseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'COURSE',
        required: true
    },
    attendance:{
        type: Number,
        required:true
    },
})





const RegisteredCourse = mongoose.model("REGISTEREDCOURSE", registeredCourseSchema);

module.exports = RegisteredCourse;

