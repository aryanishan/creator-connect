import mongoose from 'mongoose';

const tokenPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    planId: {
      type: String,
      required: true
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    cfOrderId: {
      type: String,
      default: ''
    },
    cfPaymentId: {
      type: String,
      default: '',
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    tokens: {
      type: Number,
      required: true
    },
    bonusTokens: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'PAID', 'FAILED'],
      default: 'CREATED'
    },
    paymentStatus: {
      type: String,
      default: 'NOT_ATTEMPTED'
    },
    creditedAt: {
      type: Date,
      default: null
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

const TokenPurchase = mongoose.model('TokenPurchase', tokenPurchaseSchema);

export default TokenPurchase;

