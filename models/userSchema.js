const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullname:{
        type: String,
        required:true
    },
    email:{
        type: String,
        required:true
    },
    registrationNo:{
        type: String,
        required:false
    },
    batchNo:{
        type:String,
        required:false,
    },
    department:{
        type: String,
        required:true
    },
    password:{
        type: String,
        required:true
    },
    role:{
        type: String,
        required:true
    },
    profilePicture:{
        type: String,
        required: true
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
})


userSchema.pre('save', async function(next){
    console.log("HASHING");
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});


userSchema.methods.generateAuthToken = async function(){
    try {
        const token = jwt.sign({_id:this._id}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token:token});
        await this.save();
        return token;
    } catch (error) {
        console.log(error);
    }
}




const User = mongoose.model("USER", userSchema);

module.exports = User;

