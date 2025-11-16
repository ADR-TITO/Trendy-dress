const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['dresses', 'tracksuits', 'others', 'khaki-pants-jeans']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    size: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: '' // Base64 encoded image or URL
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
productSchema.index({ category: 1 });
productSchema.index({ name: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;


