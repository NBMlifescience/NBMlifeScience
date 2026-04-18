const Admin = require("../models/Admin");

exports.settingsPage = async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.admin._id);
   res.render("settings/index", {
  active: "settings",
  admin
});
  } catch (err) {
    console.log(err);
    res.send("Error loading settings");
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      shopName,
      shopAddress,
      shopPhone,
      shopGSTIN,
      shopDrugLicense,
      logoPath
    } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      req.session.admin._id,
      {
        shopName,
        shopAddress,
        shopPhone,
        shopGSTIN,
        shopDrugLicense,
        logoPath
      },
      { new: true }
    );

    req.session.admin = admin;

    req.flash("success_msg", "Settings updated successfully");
    res.redirect("/settings");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error updating settings");
    res.redirect("/settings");
  }
};