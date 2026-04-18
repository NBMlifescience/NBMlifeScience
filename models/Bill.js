const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true
  },

  buyer: {
    name: String,
    address: String,
    dlNo: String,
    gstin: String,
    phone: String
  },

  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      name: String,
      mfgDate: Date,
      batch: String,
      expiry: Date,
      quantity: Number,
      freeQty: {
        type: Number,
        default: 0
      },
      priceType: String,
      price: Number,
      gst: Number,
      total: Number,
      piecesPerPack: Number
    }
  ],

  totalAmount: Number,

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date,
    default: null
  },

  date: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model("Bill", billSchema);