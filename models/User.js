import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Name is required"]
    },
    email: {
        type:String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim:true
    },
    password: {
        type:String,
        required:[true, "Password is Required"],
        minlength: [6, "Password must be at least 6 character"]
    },
    cartItems:[
        {
            quantity:{
                type:Number,
                default: 1
            }, 
            productId: {
                type: mongoose.Schema.Types.ObjectId, 
                ref: "Product"
            }
        }
    ],
    role: {
        type:String,
        enum:["customer", "admin", "super-admin"],
        default: "customer"
    }

    
},{timestamps: true})

// Hashing password

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next()
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

const User = mongoose.model('User', userSchema)

export default User

