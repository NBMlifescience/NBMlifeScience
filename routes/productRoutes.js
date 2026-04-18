const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { isAuth } = require("../middleware/auth");

// Add Product
router.get("/products/add", isAuth, productController.addForm);
router.post("/products/add", isAuth, productController.addProduct);

// List Products
router.get("/products", isAuth, productController.getProducts);

// Delete
router.get("/products/delete/:id", isAuth, productController.deleteProduct);

// Edit
router.get("/products/edit/:id", isAuth, productController.editForm);
router.post("/products/edit/:id", isAuth, productController.updateProduct);
router.get("/products/expiry", isAuth, productController.expiryProducts);
router.get("/products/low-stock", isAuth, productController.lowStockProducts);
module.exports = router;