import express from 'express'
const router = express.Router()

import {createPaymentCheckout, checkOutSuccess} from '../controller/orderController.js'
import { protectRoute } from '../middleware/userMiddleware.js'

router.post('payment-checkout', protectRoute, createPaymentCheckout)
router.get('/oreder-created', protectRoute, checkOutSuccess)


export default router