const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true
    },
    slot: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    class: {
        type: String,
        required: true
    }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
