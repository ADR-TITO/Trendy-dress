const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    productId: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: String,
        required: true
    },
    customer: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            default: ''
        }
    },
    items: [orderItemSchema],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        required: true
    },
    mpesaCode: {
        type: String,
        required: true,
        uppercase: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'failed', 'duplicate'],
        default: 'pending'
    },
    delivery: {
        option: {
            type: String,
            default: 'pickup'
        },
        optionText: {
            type: String,
            default: 'Shop Pickup'
        },
        cost: {
            type: Number,
            default: 0
        },
        address: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        deliveredAt: {
            type: Date
        },
        deliveredBy: {
            type: String,
            default: ''
        }
    },
    subtotal: {
        type: Number,
        default: 0
    },
    totalPaid: {
        type: Number,
        default: 0
    },
    mpesaCodes: [{
        code: String,
        amount: Number
    }],
    mpesaCodesString: {
        type: String,
        default: ''
    },
    verificationDetails: {
        amountMatch: {
            type: Boolean,
            default: false
        },
        dateValid: {
            type: Boolean,
            default: false
        },
        isDuplicate: {
            type: Boolean,
            default: false
        },
        verifiedAt: {
            type: Date
        },
        verifiedBy: {
            type: String,
            default: 'system'
        }
    }
}, {
    timestamps: true
});

// Index for faster queries
orderSchema.index({ mpesaCode: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ verified: 1 });

// Method to check for duplicate M-Pesa codes
orderSchema.statics.findByMpesaCode = function(mpesaCode) {
    return this.findOne({ mpesaCode: mpesaCode.toUpperCase() });
};

// Method to verify transaction
orderSchema.methods.verifyTransaction = function(expectedAmount, transactionDate) {
    const transaction = transactionDate ? new Date(transactionDate) : this.createdAt;
    const now = new Date();
    const hoursDiff = (now - transaction) / (1000 * 60 * 60);
    const dateValid = hoursDiff >= 0 && hoursDiff <= 48; // Valid if within last 48 hours
    
    const verification = {
        amountMatch: Math.abs(this.total - expectedAmount) < 1, // Allow 1 KSh difference for rounding
        dateValid: dateValid,
        isDuplicate: false
    };
    
    this.verificationDetails = {
        ...verification,
        verifiedAt: new Date(),
        verifiedBy: 'system'
    };
    
    if (verification.amountMatch && verification.dateValid && !verification.isDuplicate) {
        this.verified = true;
        this.verificationStatus = 'verified';
    } else if (verification.isDuplicate) {
        this.verificationStatus = 'duplicate';
    } else {
        this.verificationStatus = 'failed';
    }
    
    return verification;
};


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

