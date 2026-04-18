const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");

exports.loginPage = (req, res) => {
  res.render("auth/login");
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });

  if (!admin) return res.send("User not found");

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) return res.send("Wrong password");

  req.session.admin = admin;
  res.redirect("/dashboard");
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/login");
};