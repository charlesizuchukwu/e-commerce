import User from "../models/User.js"
import Order from "../models/Order.js"
import Product from "../models/Product.js"


export const getAnalyticsDate = async (req, res) => {
    try {
        const totalUser = await User.countDocuments()
        const totalProducts = await Product.countDocuments()

        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ])

        const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 }

        return res.status(200).json({
            message: "Sales Analysis",
            totalUser,
            totalProducts,
            totalSales,
            totalRevenue
        })

    } catch (error) {
        console.log('Error in getAnalyticsDate', error.message)
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}