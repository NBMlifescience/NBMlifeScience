const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,

  shopName: {
    type: String,
    default: "Your Medical Store"
  },
  shopAddress: {
    type: String,
    default: "Shop Address"
  },
  shopPhone: {
    type: String,
    default: "9999999999"
  },
  shopGSTIN: {
    type: String,
    default: "YOUR-GSTIN"
  },
  shopDrugLicense: {
    type: String,
    default: "DRUG-LIC-NO"
  },
  logoPath: {
    type: String,
    default: "/images/logo.png"
  }
});

module.exports = mongoose.model("Admin", adminSchema);