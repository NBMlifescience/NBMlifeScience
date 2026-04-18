const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { isAuth } = require("../middleware/auth");

router.get("/settings", isAuth, settingsController.settingsPage);
router.post("/settings", isAuth, settingsController.updateSettings);

module.exports = router;