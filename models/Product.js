const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  manufacturer: String,
  batchNo: String,
  mfgDate: Date,
  expiryDate: Date,
  hsnCode: String,

  purchasePrice: Number,
  ptrPrice: { type: Number, required: true },
  ptsPrice: { type: Number, required: true },

  gstRate: { type: Number, default: 0 },

  quantity: { type: Number, default: 0 },

  piecesPerPack: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);