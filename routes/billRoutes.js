const express = require("express");
const router = express.Router();
const billController = require("../controllers/billController");
const { isAuth } = require("../middleware/auth");

router.get("/bill/create", isAuth, billController.createBillPage);
router.post("/bill/save", isAuth, billController.saveBill);

router.get("/bill/trash", isAuth, billController.trashBills);

router.get("/bills", isAuth, billController.billHistory);

router.get("/bill/:id/pdf", isAuth, billController.downloadBillPdf);
router.get("/bill/:id/delete", isAuth, billController.deleteBill);
router.get("/bill/:id/restore", isAuth, billController.restoreBill);
router.get("/bill/:id", isAuth, billController.viewBill);

module.exports = router;