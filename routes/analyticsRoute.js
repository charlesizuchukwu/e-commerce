import express from 'express'
import {protectRoute, verifyRole} from '../middleware/userMiddleware.js'
import {getAnalyticsDate} from '../controller/analyticController.js'
const router = express.Router()

router.get('/analysis', protectRoute, verifyRole(["superAdmin"]), getAnalyticsDate)

export default router