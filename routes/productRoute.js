import express from 'express'
const router = express.Router()
import {getAllProduct, getFeatured, addProduct, deleteProduct, getRecommendedProduct, getCategory} from '../controller/productController.js'
import { protectRoute, verifyRole } from '../middleware/userMiddleware.js'

router.get('/all', protectRoute, verifyRole(["admin", "super-admin"]), getAllProduct)
router.get('/featured', getFeatured)
router.get('/:category', getCategory)
router.get('/recommended', protectRoute, getRecommendedProduct)
router.post('/add-product', protectRoute, verifyRole(["admin", "super-admin"]), addProduct)
router.patch('/add-featured:id', protectRoute, verifyRole(["admin", "super-admin"]), deleteProduct)




export default router