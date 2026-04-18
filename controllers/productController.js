const Product = require("../models/Product");

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      manufacturer,
      batchNo,
      mfgDate,
      expiryDate,
      hsnCode,
      purchasePrice,
      ptrPrice,
      ptsPrice,
      gstRate,
      quantity,
      piecesPerPack
    } = req.body;

    await Product.create({
      name,
      manufacturer,
      batchNo,
      mfgDate,
      expiryDate,
      hsnCode,
      purchasePrice,
      ptrPrice,
      ptsPrice,
      gstRate,
      quantity,
      piecesPerPack
    });

    req.flash("success_msg", "Product added successfully");
    res.redirect("/products");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error adding product");
    res.redirect("/products/add");
  }
};

// Get All Products
exports.getProducts = async (req, res) => {
  try {
    const search = req.query.search || "";

    let filter = {};

    if (search.trim() !== "") {
      filter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { manufacturer: { $regex: search, $options: "i" } },
          { batchNo: { $regex: search, $options: "i" } }
        ]
      };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.render("products/list", {
      active: "products",
      products,
      search
    });
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error loading products");
    res.redirect("/dashboard");
  }
};

// Show Add Form
exports.addForm = (req, res) => {
  res.render("products/add", {
    active: "products"
  });
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Product deleted successfully");
    res.redirect("/products");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error deleting product");
    res.redirect("/products");
  }
};

// Edit Form
exports.editForm = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      req.flash("error_msg", "Product not found");
      return res.redirect("/products");
    }

    res.render("products/edit", {
      active: "products",
      product
    });
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error loading product edit form");
    res.redirect("/products");
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      manufacturer,
      batchNo,
      mfgDate,
      expiryDate,
      hsnCode,
      purchasePrice,
      ptrPrice,
      ptsPrice,
      gstRate,
      quantity,
      piecesPerPack
    } = req.body;

    await Product.findByIdAndUpdate(req.params.id, {
      name,
      manufacturer,
      batchNo,
      mfgDate,
      expiryDate,
      hsnCode,
      purchasePrice,
      ptrPrice,
      ptsPrice,
      gstRate,
      quantity,
      piecesPerPack
    });

    req.flash("success_msg", "Product updated successfully");
    res.redirect("/products");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error updating product");
    res.redirect("/products");
  }
};

// Expiry Products
exports.expiryProducts = async (req, res) => {
  try {
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const products = await Product.find({
      expiryDate: {
        $gte: today,
        $lte: sixMonthsLater
      }
    }).sort({ expiryDate: 1 });

    res.render("products/expiry", {
      active: "expiry",
      products
    });
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error loading expiry products");
    res.redirect("/products");
  }
};

// Low Stock Products
exports.lowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      quantity: { $lt: 10 }
    }).sort({ quantity: 1 });

    res.render("products/low-stock", {
      active: "low",
      products
    });
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error loading low stock products");
    res.redirect("/products");
  }
};