import express from "express"
const router = express.Router()
import {userReg, userLogout, userLogin, refreshUserToken, adminDashboard, superAdminDashboard} from "../controller/authController.js"
import { protectRoute, verifyRole } from "../middleware/userMiddleware.js"

router.post("/signup", userReg)
router.post("/logout", userLogout)
router.post('/refreshtoken', refreshUserToken)
router.post("/login", userLogin)
router.get('/admin/dashboard', protectRoute, verifyRole(["admin"]), adminDashboard)
router.get('/super-admin/dashboard', protectRoute, verifyRole(["super-admin"]), superAdminDashboard)

export default router