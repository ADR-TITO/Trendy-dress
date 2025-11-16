const mongoose = require('mongoose');

const mpesaTransactionSchema = new mongoose.Schema({
    receiptNumber: {
        type: String,
        required: true,
        uppercase: true,
        index: true,
        unique: true
    },
    transactionDate: {
        type: Date,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    phoneNumber: {
        type: String,
        required: true
    },
    accountReference: {
        type: String,
        default: ''
    },
    transactionType: {
        type: String,
        enum: ['CustomerPayBillOnline', 'CustomerBuyGoodsOnline', 'PayBill', 'BuyGoods'],
        default: 'CustomerPayBillOnline'
    },
    merchantRequestID: {
        type: String,
        default: ''
    },
    checkoutRequestID: {
        type: String,
        default: ''
    },
    resultCode: {
        type: Number,
        default: 0
    },
    resultDesc: {
        type: String,
        default: ''
    },
    mpesaReceiptNumber: {
        type: String,
        default: ''
    },
    // Raw M-Pesa response data
    rawData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    usedInOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
mpesaTransactionSchema.index({ receiptNumber: 1 });
mpesaTransactionSchema.index({ phoneNumber: 1 });
mpesaTransactionSchema.index({ transactionDate: -1 });
mpesaTransactionSchema.index({ verified: 1 });
mpesaTransactionSchema.index({ usedInOrder: 1 });

// Static method to find transaction by receipt number
mpesaTransactionSchema.statics.findByReceiptNumber = function(receiptNumber) {
    return this.findOne({ receiptNumber: receiptNumber.toUpperCase() });
};

// Static method to find transactions by phone and date range
mpesaTransactionSchema.statics.findByPhoneAndDate = function(phoneNumber, startDate, endDate) {
    return this.find({
        phoneNumber: phoneNumber,
        transactionDate: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ transactionDate: -1 });
};

// Static method to find transactions matching amount and date
mpesaTransactionSchema.statics.findMatchingTransaction = function(receiptNumber, amount, transactionDate) {
    const code = receiptNumber.toUpperCase();
    const date = new Date(transactionDate);
    const startDate = new Date(date.getTime() - (24 * 60 * 60 * 1000)); // 1 day before
    const endDate = new Date(date.getTime() + (24 * 60 * 60 * 1000)); // 1 day after
    
    return this.findOne({
        receiptNumber: code,
        amount: { $gte: amount - 1, $lte: amount + 1 }, // Allow 1 KSh difference
        transactionDate: {
            $gte: startDate,
            $lte: endDate
        }
    });
};

const MpesaTransaction = mongoose.model('MpesaTransaction', mpesaTransactionSchema);

module.exports = MpesaTransaction;








