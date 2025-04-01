import Coupon from '../models/Coupon.js'
import { randomUUID } from 'crypto'

const generateUniqueCouponCode = () => {
    return randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase();
};

export const generateCoupon = async (req, res) => {
    try {
        
        const {userId, discountPercentage} = req.body
        
        console.log(req.body)
        
        if(discountPercentage < 0 || discountPercentage > 100) {
            return res.status(400).json({ message: "Discount percentage must be between 1 and 100" })
        }

        let code;

        do {
            code = generateUniqueCouponCode();
        } 
        while (await Coupon.findOne({ code }));

        const newCoupon = new Coupon ({
            code,
            discountPercentage,
            expDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            userId
        })
        await newCoupon.save()

        return res.status(200).json({message: "Coupon Created", newCoupon})   

    } catch (error) {
        console.log('Error in createCoupon', error.message)
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

export const getCoupon = async (req, res) => {
    
    try {
        const userId = req.user._id

        const coupon = await Coupon.findOne({userId:userId, isActive: true})

        if(!coupon) res.status(400).json({messgae: "Invalide Coupon"})
            
        res.status(201).json(coupon)

    } catch(error) {
        console.log('Error in couponController', error.message)
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

export const getAllCoupon = async (req, res) => {
    try{
        const coupon = await Coupon.find({})
        if(!coupon) return res.status(404).json({message: "No Coupon Found"})
        res.status(201).json(coupon)
    } catch (error) {
        console.log('Error in getAllCoupon', error.message)
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

export const validateCoupon = async (req, res) => {
    try {
        const {code} = req.body
        
        const userId = req.user._id

        const coupon = await Coupon.findOne({
            code:code, 
            userId:userId, 
            isActive:true
        })

        if(!coupon) {
            return res.status(404).json({message: "Coupon not Active"})
        }
        
        // validate coupon if has expired or not

        if(coupon.expDate < new Date()) {
            coupon.isActive = false
            await coupon.save()
            return res.status(404).json({message: "Coupon expired"})
        }

        res.json ({
            message: "Coupon is valid",
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,
            expDate: coupon.expDate
        })
    } catch(error) {
        console.log('Error in validateCoupon', error.message)
        res.status(500).json({message: "Server Error", error: error.message})
    }

}