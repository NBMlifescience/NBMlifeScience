const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { isAuth } = require("../middleware/auth");

router.get("/dashboard", isAuth, dashboardController.dashboardPage);
router.get("/dashboard/month-sales-excel", isAuth, dashboardController.downloadMonthlySalesExcel);

module.exports = router;