require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const hashedPassword = await bcrypt.hash("123456", 10);

    await Admin.deleteMany({}); // optional: clean old wrong data

    await Admin.create({
      username: "admin",
      password: hashedPassword,
      shopName: "NBM Billing",
      shopAddress: "Your Shop Address",
      shopPhone: "9999999999",
      shopDrugLicense: "DL123456",
      shopGSTIN: "27ABCDE1234F1Z5",
      logoPath: "/images/logo.png"
    });

    console.log("Admin created successfully");
    console.log("Username: admin");
    console.log("Password: 123456");

    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

createAdmin();