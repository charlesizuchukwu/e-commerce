import express from "express"
import dotenv from "dotenv"

import cookieParser from 'cookie-parser'

import authRoutes from "./routes/authRoutes.js"

import productRoutes from "./routes/productRoute.js"

import cartRoutes from "./routes/cartRoutes.js"

import couponRoute from './routes/couponRoute.js'

import paymentRoutes from './routes/paymentRoutes.js'

import analyticsRoute from './routes/analyticsRoute.js'

import {connectDB} from "./config/db.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3005

app.use(express.json())
app.use(cookieParser())

connectDB()

app.use("/api/auth", authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/coupons', couponRoute)
app.use('/api/order', paymentRoutes)
app.use('/api/analytics', analyticsRoute)

app.listen(PORT, () => {
    console.log(`Server is running in http://localhost:${PORT}`)

    
})
