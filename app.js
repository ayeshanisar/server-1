const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const cors = require('cors');
app.use(cors());
const dotenv  = require('dotenv');
dotenv.config({path:'./config.env'});
app.use(express.json());
require('./db/conn');

app.use(require('./routers/auth'));

const PORT = process.env.PORT;

app.listen(PORT, ()=>{
    console.log("Server is running on port no.", PORT);
})

// module.exports = app;

