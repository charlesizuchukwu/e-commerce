import express from "express"
import {addToCart, removeFromCart, increaseQuantity, getProductIncart} from '../controller/cartController.js'
import { protectRoute, verifyRole } from "../middleware/userMiddleware.js"

const router = express.Router()

router.get('/get-cartitems', protectRoute, verifyRole(["user", "admin", "super-admin"]), getProductIncart)
router.post('/add', protectRoute, verifyRole(["user", "admin", "super-admin"]), addToCart)
router.delete('/remove', protectRoute, verifyRole(["user", "admin", "super-admin"]), removeFromCart)
router.put('/quantity/:id', protectRoute, verifyRole(["user", "admin", "super-admin"]), increaseQuantity)


export default router