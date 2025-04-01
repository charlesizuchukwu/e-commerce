import Product from '../models/Product.js'
import {redis} from '../config/redis.js'
import cloudinary from '../config/cloudinary.js'

export const addProduct = async (req, res) => {
    try {
        const {name, description, price, image, category} = req.body

        
        // adding image of the product to cloudinary
        // if (image) {
        //     cloudinaryResponse = await cloudinary.uploader
        //     .upload(image, {folder: "products"})
        //     .then(result => console.log(result));
        // } else {
        //     cloudinaryResponse = null
        // }
        
        const product = await Product.create ({
            name, 
            description,
            price,
            // image: cloudnaryResponse?.secure_url ? cloudnaryResponse.secure_url : " ",
            category
        })

        res.status(201).json({message: "Product Uploaded", product: product})
    } catch (error) {
        console.log("Error in createProduct controller", error.message)
        res.status(500).json({message: "Server error", error: error.message})
    }
}

export const getAllProduct = async (req, res) => {
    try {
        const products = await Product.find({})
        if(!products) return res.status(404).json({message: "No product found"})

        res.json(products)
    } catch(error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}


export const deleteProduct = async (req, res) => {
    try {
       const product = await Product.findById(req.params.id)

        if(!product) return res.status(500).json({message: "Product Not Found"})
        
        // delete product from cloudinary
        if(product.image) {
            const productId = product.image.split('/').pop.splith('.')[0]
            try {
                await cloudinary.uploader.destroy(`products/${productId}`)
            } catch(error) {
                console.log("error deleting image")
            }
        }

        await Product.findByIdAndDelete(req.params.id)

        res.status(200).json({message: "Product deleted successfully"})
    } catch(error) {

        console.log("error in deletingProduct controller")
        res.status(500).json({message: "Server Error", error: error.message})

    }
}

export const getRecommendedProduct = async (req, res) => {
    try {
        const product = await Product.aggregrate([
            {
                $sample: {size: 7} // amount of product shown on recommended product
            },
            {
                $project: { // the data extracted from each product from mongodb
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1,
                }
            }
        ])

        res.json(product)
    } catch(error) {
        console.log("Error in recommendedProduct controller", error.message)
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

export const getCategory = async (req, res) => {
    try {
        const {category} = req.params

        const products = await Product.find({category})

        if (products.length === 0) {
            return res.status(404).json({ message: "No products found in this category." });
        }
        
        res.json(products)

    } catch(error) {
        console.log("Error in categoryController controller", error.message)
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

export const getFeatured = async (req, res) => {
    try {
        let featuredProduct = await redis.get("featured_products") // get featured products from redis 
        // if the featured product is in redis to return it fast
        if(featuredProduct) return res.json(JSON.parse(featuredProduct))

        featuredProduct = await Product.find({isFeatured: true}).lean()
        if(!featuredProduct) {
            return res.status(404).json({message: "No featured product found"})
        }

        await redis.set('featured_product', JSON.stringify(featuredProduct))

        res.json(featuredProduct)
    } catch (error) {
        console.log('Error in getFeaturedProduct Controller')
        return res.status(500).json({message: "Server Error", error: error.message})
    }
}

export const addFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if(product) {
            product.isFeatured = !product.isFeatured
            const isFeatured = await product.save()

            await updateFeaturedCatch()
            
            res.json(isFeatured)
        } else {
            res.status(404).json({message: "Product Not Found"})
        }
    } catch(error) { 
        console.log("Error in addFeaturedProduct controller", error.message)
        res.status(500).json({message: "Server error", error: error.message})
    }
}

export const updateFeaturedCatch = async () => {
    try {
        const featuredProduct = await Product.find({isFeatured: true})
        await redis.set("featured_products", JSON.stringify(featuredProduct))
    } catch (error) {
        console.log("Error in FeaturedProductCatch controller", error.message)
        res.status(500).json({message: "Server error", error: error.message})
    }
}