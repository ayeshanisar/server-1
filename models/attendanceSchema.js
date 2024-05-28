const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    lectureNo: {
        type: Number,
        required:true
    },
    slot:{
        type: String,
        required:true
    },
    weekday:{
        type: String,
        required:true
    },
    attendance:{
        type: Boolean,
        required:true
    },
})


const Attendance = mongoose.model("ATTENDANCE", attendanceSchema);

module.exports = Attendance;

