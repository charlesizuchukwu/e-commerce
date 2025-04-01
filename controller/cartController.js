import Product from "../models/Product.js"

// get all product in cart

export const getProductIncart = async (req, res) => {
    try {
        const product = await Product.find({_id:{$in: req.user.cartItem}}) // Find all the products from the Product Schema whose _id matches the product IDs in cartItem (req.user.cartItem)

        // add the quantity of each product in cart
        const cartItems = product.map((product) => {
            const cart = req.user.cartItem.find(item => item.id === product._id)
            return {
                ...product.toJSON(), 
                quantity: cart.quantity
            }
        })

        res.json(cartItems)

    } catch (error) {
        console.log("Error in getProductIncart controller", error.message)
        res.status(500).json({message: "Server Error"}, error.message)
    }
}


// add product to cart

export const addToCart = async (req, res) => {
    try {
        const user = req.user // get the user from the protectUser 
        const {productId} = req.body
        

        const product = await Product.findById(productId)
        if(!product) return res.status(404).json({message: "Product Is Out Of Stock"})

        const exisitingCart = user.cartItems.find(item => item.id === productId)

        // increase the quantity if the product is already in cart
        if(exisitingCart) {
            exisitingCart.quantity += 1 
        } else {
        // add new product to the cart if it is not in the cart
            user.cartItems.push(productId)
        }   

        await user.save()
        res.json(user.cartItems)
    } catch (error) {
        console.log("Error in AddCart controller", error.message)
        res.status(500).json({message: "Server Error"}, error.message)


    }
}

// remove product from cart

export const removeFromCart = async (req, res) => {
    try {
        const {productId} = req.body
        const user = req.user

        if(!productId) {
            user.cartItems = []
        } else {
            user.cartItem = user.cartItems.filter((item) => item.id !== productId)
            await user.save()
            res.json(user.cartItem)
        }
    } catch (error) {
        res.status(500).jsoon({message: "Server Error", error: error.message})
    }
}

// Increase product quantity

export const increaseQuantity = async (req, res) => {
    try {
        const user = req.user
        const {productId} = req.params
        const {quantity} = req.body

        const exisitngItem = user.cartItems.find((item) => item.id === productId)

        if(exisitngItem) {
                // Delete product from cart item if the qunatity is = 0
            if(quantity === 0) {
                user.cartItems = user.cartItems.filter((item) => item.id !== productId)
                await user.save()
                return res.json(user.cartItems)
            }

            exisitngItem.quantity = quantity
            await user.save()
            res.json(user.cartItems)
        } else {
            res.status(404).json({message: "Product not found "})
        }
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }   
}

