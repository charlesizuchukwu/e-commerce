import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'

dotenv.config()



// Protected Route AUTHORIZATION

export const protectRoute = async (req, res, next) => {
    try {

        const accessToken = req.cookies.accessToken 

        // || req.cookies.accessToken || 
        // (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? 
        //  req.headers.authorization.split(' ')[1] : null);

        if(!accessToken) return res.status(401).json({message: "Unauthorized - Access Denied"})

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
            const user = await User.findById(decoded.userId).select('-password')
            if(!user) return res.status(401).json({message: "User not found"})

            req.user = user

            console.log("Decoded user:", req.user)

            next()
            
            } catch (error) {
                if(error.name === "TokenExpiredError") {
                    return res.status(401).json({message: "Token expired"})
                } else {
                    throw new error
                }
            } 
    } catch(error) {
        console.log("Error in protectedRoute Middleware", error.message)
        res.status(500).json({message: "Unauthorized ", error: error.message })
    }
}

// Admin Authorization middle ware Role Based Authentication

export const verifyRole = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        console.log(`Unauthorized access attempt by user: ${req.user._id}, role: ${req.user.role}, attempted route: ${req.originalUrl}`)
        return res.status(403).json({ message: 'Access Denied' });
      }
      next();
    };
  };

