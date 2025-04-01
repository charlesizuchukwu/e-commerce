import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import {redis} from '../config/redis.js'
import dotenv from "dotenv"
dotenv.config()



const genToken = (userId, role) => {
    const accessToken = jwt.sign(
        {userId, role}, 
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: "15min"}
    )

    const refreshToken =  jwt.sign (
        {userId, role},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: "7d"}
    )

    return {accessToken, refreshToken}
}

//store Token is redis
const storeRefreshToken = async(userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60)
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        sameSite: "strict",
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // make the cookies hidden and secured
        maxAge: 15 * 60 * 1000,
      }) 

      res.cookie("refresh", refreshToken, {
        sameSite: "strict",
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // make the cookies hidden and secured
        maxAge:  7 * 24 * 60 * 60 * 1000,
      })
}

export const userReg = async (req, res) => {
    const {name, email, password,role} = req.body
    
    try {
        const userExist = await User.findOne({email})
        if(userExist) return res.status(400).json({message: "User Already Exist"})
    
        const user = await User.create({name, email, password,role})
        
        const {accessToken, refreshToken} = genToken(user._id, user.role)
        await storeRefreshToken(user._id, user.role, refreshToken)

        setCookies(res, accessToken, refreshToken)

        res.status(201).json({message: "User Created Successfully", user: {_id: user._id, name: user.name, email: user.email, role: user.role} })
        console.log(user)
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

export const userLogin = async (req, res) => {

    const {email, password} = req.body
    console.log(req.body)
    try {
        const user = await User.findOne({email})
        if(!user && (await bcrypt.compare(password, user.password))) {
            return res.status(404).json({message: "Invalid Email or Password"})
        }

        const {accessToken, refreshToken} = genToken(user._id, user.role)

        await storeRefreshToken(user._id, user.role, refreshToken)

        setCookies(res, accessToken, refreshToken)

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            accessToken, 
            refreshToken
        })

    } catch (error) {
        console.log("Error in login controller", error.message)
        res.status(500).json({message: "Server Error", error: error.message})
    }
}


export const userLogout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh
        if(refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`)
        }
        res.clearCookie("accessToken")
        res.clearCookie("refresh")
        res.json({message: "Logged Out Successfully"})

    } catch(error) {      
        console.log(error.message)
        res.status(500).json({message: "Server Error", error: error.message})
    }
}


// middleware to authenticate and authorize the refresh token without exposing it to the frontend
// and keeping admin loged in without letting him logout repeatedly

export const refreshUserToken = async (req, res) => {
    try{ 
        const refreshToken = req.cookies.refresh
    
        if(!refreshToken) return res.status(401).json({message: "No refresh token provided"})
        
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

        const storedToken = await redis.get(`refresh_token:${decoded.userId}`)

        if(!storedToken || storedToken !== refreshToken) {
            return res.status(401).json({message: "Invalid Token"})
        }

        const accessToken = jwt.sign(
            {userId: decoded.userId, role: decoded.role},
             process.env.ACCESS_TOKEN_SECRET, 
             {expiresIn: "15min"})
    
        res.cookie("accessToken", accessToken, {
            sameSite: "strict",
            secure: process.env.NODE_ENV === 'production' ? true : false,
            httpOnly: true, // make the cookies hidden and secured
            maxAge: 15 * 60 * 1000,
          }) 

          res.json({message: "Token refresh Sucessfully", accessToken})
        
    } catch(error) {
        console.log('Error in refrshingToken Middleware', error.message)
        res.status(500).json({message: 'Server Error', error: error.message})
    } 
}


export const adminDashboard = async (req, res) => {
    try {
        res.status(201).json({message: `Wellcome Admin ${req.user._id}`})
    } catch (error) {
        res.status(500).json({message: "Error in adminDashboardController", error: error.message})
        
    }
}

export const superAdminDashboard = async (req, res) => {
    try {
        res.status(201).json({message: `Wellcome Super Admin ${req.user._id}`})
    } catch (error) {
        res.status(500).json({message: "Error in superAdminDashboardController", error: error.message})
        
    }
}
