import express from 'express'
const router = express.Router()
import {protectRoute, verifyRole} from '../middleware/userMiddleware.js'
import {
    getCoupon, 
    generateCoupon, 
    getAllCoupon, 
    validateCoupon} from '../controller/couponController.js'

router.post('/generate-coupon', protectRoute, verifyRole(["admin", "super-admin"]),  generateCoupon)
router.get('/get-active-coupon', protectRoute,verifyRole(["admin", "super-admin"]), getCoupon)
router.get('/get-all-coupon', protectRoute,verifyRole(["admin", "super-admin"]), getAllCoupon)
router.post('/validate-coupon', protectRoute, verifyRole(["user", "admin", "super-admin"]), validateCoupon)

export default router