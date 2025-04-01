import Order from '../models/Order.js'
import Coupon from '../models/Coupon.js'
import {stripe} from '../config/stripe.js'
import { randomUUID } from 'crypto'


// create stripe coupon using stripe AP

const generateUniqueCouponCode = () => {
    return randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase();
};


// Creating coupon for order above 2000

const createCoupon = async (userId) => {

    try {

        let code

        do {
            code = generateUniqueCouponCode();
        } 
        while (await Coupon.findOne({ code }));

        const newCoupon = new Coupon ({
            code,
            discountPercentage: 10,
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            userId:userId
        })
        await newCoupon.save()
        return newCoupon

    } catch (error) {
        console.log('Error in createCoupon', error.message)
        throw new Error('Error creating coupon: ' + error.message)
    }
}


// create a one time stripe coupom
const createStripeCoupon = async (discountPercentage) => {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once"
    })

    return coupon.id
}


export const createPaymentCheckout = async (req, res) => {

    try {
        const {products, couponCode} = req.body

        if(!Array.isArray(products) || products.length === 0 ) {
            return res.status(404).json({message: "Add Products To Cart"})
        }

        // Calculate the total Total Amount

        let totalAmount = 0

        const lineItems = products.map(product => {
            const price = Math.round(product.price * 100) // convert price to cents because that is what stripe reads
            totalAmount += price * product.quantity
            
            // Data sent to stripe based on stripe syntax

            return {
                price_data: {
                    currency: "gbp",
                    product_data: {
                        name: product.name,
                        images: [product.image]
                    },
                    unit_amount: price
                }

            }
        })

        // check if their is coupon and apply the coupon discount

        let coupon = null

        if(couponCode) {
            coupon = await Coupon.findOne({code:couponCode, userId:req.user._id, isActive:true})
            if(coupon) {
                totalAmount -= Math.round(totalAmount * coupon.discountPercentage / 100)
            } else {
                return res.status(404).json({message: "Invalid Coupon"})
            }
        }

        // validate payment checkout session 

        const session = await stripe.checkout.session.create({
            payment_method_types:["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: "http://localhost:3000/purchase-success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "http://localhost:3000/purchase-cancel",
            discounts: coupon ? [{coupon: await createStripeCoupon(coupon.discountPercentage)}] : [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode:couponCode || "",
                products: JSON.stringify(products.map ((product) => ({
                    id: product.id,
                    quantity: product.quantity,
                    price: product.price
                })
            ))
            }
        })

        if (totalAmount >= 2000) {
            await createCoupon(req.user._id)
        }

        res.staus(200).json({id:session.id, totalAmount: totalAmount / 100})

    } catch (error) {

        console.error("Error in createPaymentCheckout:", error);
        res.status(500).json({ message: "Server Error", error: error.message });

    }

}

// creating Order

export const checkOutSuccess = async (req, res) => {
    try {
        const {sessionId} = req.body
        
        const session = await stripe.checout.session.retrieve(sessionId)

        if(session.payment_status === "paid") {
            if(session.metadata.couponCode) {
                const coupon = await Coupon.findOneAndUpdate({ code: session.metadata.couponCode, userId: session.metadata.userId}, {isActive: false})
                await coupon.save()
        } 

        const products = JSON.parse(session.metadata.products)
        const newOrder = new Order ({
            user: session.metadata.userId,
            products: products.map(product => ({
                product: product.id,
                quantity: product.quantity,
                price: product.price
            })),
            totalAmount: session.amount_total / 100, // convert fron pens to pounds,
            stripeSessionId: sessionId
        })

        await newOrder.save()
        res.status(200).json({
            success: true,
            message: "Order Created",
            orderId: newOrder._id
        })
    } 
} catch (error) {
    console.error("Error in checkOutSuccess:", error);
    res.status(500).json({ message: "Server Error", error: error.message }); 
    }
}