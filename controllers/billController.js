const Bill = require("../models/Bill");
const Product = require("../models/Product");
const Admin = require("../models/Admin");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");



function numberToWords(num) {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
  }

  return inWords(Math.floor(num || 0)) + " Rupees Only";
}



// ✅ SHOW CREATE BILL PAGE
exports.createBillPage = async (req, res) => {
  try {
    const products = await Product.find();
   res.render("bill/create", {
  active: "create",
  products
});
  } catch (err) {
    console.log(err);

    req.flash("error_msg", "Error loading bill page");
    res.redirect("/dashboard"); // better fallback
  }
};

// ✅ SAVE BILL
// ✅ SAVE BILL
exports.saveBill = async (req, res) => {
  try {
    const { buyer } = req.body;
    let items = req.body.items || [];

    if (!Array.isArray(items)) {
      items = [items];
    }

    let totalAmount = 0;
    const processedItems = [];

    for (let item of items) {
      if (!item.productId || item.productId.trim() === "") {
        continue;
      }

      const quantity = Number(item.quantity || 0);
      const freeQty = Number(item.freeQty || 0);
      const priceType = item.priceType === "pts" ? "pts" : "ptr";

      if (quantity <= 0 && freeQty <= 0) {
        continue;
      }

      const product = await Product.findById(item.productId);
      if (!product) continue;

      const availableStock = Number(product.quantity || 0);
      const totalStockNeeded = quantity + freeQty;

      if (totalStockNeeded > availableStock) {
        req.flash(
          "error_msg",
          `Not enough stock for ${product.name}. Available stock: ${availableStock}`
        );
        return res.redirect("/bill/create");
      }

      const price =
        priceType === "pts"
          ? Number(product.ptsPrice || 0)
          : Number(product.ptrPrice || 0);

      const gst = Number(product.gstRate || 0);

      const subtotal = quantity * price;
      const discount = subtotal * 0.20;
      const taxable = subtotal - discount;
      const gstAmount = (taxable * gst) / 100;
      const total = taxable + gstAmount;

      totalAmount += total;

      product.quantity = availableStock - totalStockNeeded;
      await product.save();

      processedItems.push({
        productId: product._id,
        name: product.name,
        mfgDate: product.mfgDate,
        batch: product.batchNo,
        expiry: product.expiryDate,
        quantity,
        freeQty,
        priceType,
        price,
        gst,
        total,
        piecesPerPack: product.piecesPerPack
      });
    }

    if (processedItems.length === 0) {
      req.flash("error_msg", "Please select at least one valid product");
      return res.redirect("/bill/create");
    }

    const lastBill = await Bill.findOne({ billNumber: { $exists: true } })
      .sort({ billNumber: -1 });

    let nextNumber = 1;

    if (lastBill && lastBill.billNumber) {
      const lastNumericPart = parseInt(lastBill.billNumber.split("-")[1], 10);
      if (!isNaN(lastNumericPart)) {
        nextNumber = lastNumericPart + 1;
      }
    }

    const billNumber = `INV-${String(nextNumber).padStart(4, "0")}`;

    const bill = await Bill.create({
      billNumber,
      buyer,
      items: processedItems,
      totalAmount
    });

    res.redirect(`/bill/${bill._id}`);
  } catch (err) {
    console.log("Error saving bill:", err);
    req.flash("error_msg", "Error saving bill");
    res.redirect("/bill/create");
  }
};
// ✅ VIEW BILL
exports.viewBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!bill) {
      req.flash("error_msg", "Bill not found or already deleted");
      return res.redirect("/bills");
    }

    const admin = await Admin.findById(req.session.admin._id);
    const amountInWords = numberToWords(bill.totalAmount || 0);

    res.render("bill/view", {
      active: "bills",
      bill,
      admin,
      amountInWords
    });
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error loading bill");
    res.redirect("/bills");
  }
};

// ✅ BILL HISTORY
exports.billHistory = async (req, res) => {
  try {
    const { from, to } = req.query;

    let filter = {
      isDeleted: false
    };

    if (from || to) {
      filter.date = {};

      if (from) {
        filter.date.$gte = new Date(from);
      }

      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    const bills = await Bill.find(filter).sort({ date: -1 });
res.render("bill/history", {
  active: "bills",
  bills,
  from,
  to
});
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error loading bill history");
    res.redirect("/dashboard");
  }
};







exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill || bill.isDeleted) {
      req.flash("error_msg", "Bill not found or already deleted");
      return res.redirect("/bills");
    }

    bill.isDeleted = true;
    bill.deletedAt = new Date();
    await bill.save();

    req.flash("success_msg", "Bill moved to temporary delete for 15 days");
    res.redirect("/bills");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error deleting bill");
    res.redirect("/bills");
  }
};

exports.trashBills = async (req, res) => {
  try {
    const bills = await Bill.find({ isDeleted: true }).sort({ deletedAt: -1 });
res.render("bill/trash", {
  active: "bills",
  bills
});
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error loading trash bills");
    res.redirect("/bills");
  }
};

exports.restoreBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill || !bill.isDeleted) {
      req.flash("error_msg", "Bill not found in trash");
      return res.redirect("/bill/trash");
    }

    bill.isDeleted = false;
    bill.deletedAt = null;
    await bill.save();

    req.flash("success_msg", "Bill restored successfully");
    res.redirect("/bill/trash");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error restoring bill");
    res.redirect("/bill/trash");
  }
};

exports.downloadBillPdf = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      req.flash("error_msg", "Bill not found");
      return res.redirect("/bills");
    }

    const admin = await Admin.findById(req.session.admin._id);
    const amountInWords = numberToWords(bill.totalAmount || 0);

    const invoiceTemplatePath = path.join(__dirname, "../views/bill/invoice-content.ejs");
    let invoiceHtml = await ejs.renderFile(invoiceTemplatePath, {
      bill,
      admin,
      amountInWords
    });

    const logoPath = admin.logoPath || "/images/logo.png";
const baseUrl = `${req.protocol}://${req.get("host")}`;
const logoUrl = `${baseUrl}${logoPath}`;
invoiceHtml = invoiceHtml.replace(logoPath, logoUrl);
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice PDF</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            background: #fff; 
            color: #000; 
            padding: 2px; 
          }

          .invoice-sheet { 
            width: 100%; 
            border: 1px solid #000; 
            display: flex; 
            flex-direction: column; 
          }

          .title-bar { 
            text-align: center; 
            font-size: 11pt; 
            font-weight: 900; 
            padding: 3px 0; 
            border-bottom: 1px solid #000; 
            letter-spacing: 1px;
          }

          /* --- STRICT GRID RATIOS FIXED --- */
          .header-grid { 
            display: grid; 
            grid-template-columns: minmax(0, 2.8fr) minmax(0, 1fr) minmax(0, 1.5fr); 
            border-bottom: 1px solid #000; 
          }
          
          /* --- WORD WRAP FOR LONG TEXT APPLIED --- */
          .header-box { 
            padding: 6px 8px; 
            border-right: 1px solid #000; 
            word-wrap: break-word;
            word-break: break-word;
          }

          .header-box.seller-box {
            position: relative;
            padding-right: 180px; /* INCREASED from 130px to make room for larger logo */
          }

          .header-box:last-child { border-right: none; }

          .seller-box-inner { 
            display: block; 
          }
          
          /* --- WRAPPING ENABLED FOR LONG NAMES --- */
          .seller-name { 
            color: #cc0000; 
            font-size: 11.5pt; 
            font-weight: 900; 
            margin-bottom: 3px; 
            white-space: normal; 
          }

          .seller-address {
            font-size: 7.5pt;
            font-weight: 800;
            line-height: 1.2;
            text-transform: uppercase;
            margin-bottom: 3px;
          }

          .seller-line {
            font-size: 7.5pt;
            font-weight: 800;
            line-height: 1.3;
            margin-bottom: 1px;
          }
          
          /* LOGO SIZE INCREASED FOR PDF */
          .seller-logo { 
            position: absolute;
            right: 5px;
            top: 0;
            bottom: 0; 
            width: 170px; /* INCREASED from 120px */
            display: flex; 
            justify-content: center; 
            align-items: center; 
          }
          
          .seller-logo img { 
            width: 100%; 
            max-width: 300px; /* INCREASED from 220px */
            height: auto; 
            max-height: 400px; /* INCREASED from 250px */
            object-fit: contain; 
          }

          .meta-row { 
            display: grid; 
            grid-template-columns: 75px 10px 1fr; 
            font-size: 7.5pt; 
            font-weight: 800; 
            line-height: 1.4; 
            margin-bottom: 2px; 
          }

          .total-red {
            color: #cc0000;
            font-weight: 900;
          }

          .buyer-label {
            font-size: 8.5pt;
            font-weight: 900;
            margin-bottom: 2px;
          }

          .buyer-name {
            color: #1a3cb0;
            font-size: 11pt;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 2px;
          }

          .buyer-line {
            font-size: 7.5pt;
            font-weight: 800;
            line-height: 1.3;
            text-transform: uppercase;
          }

          .items-container {
            flex-grow: 1;
            border-bottom: 1px solid #000;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            height: 100%;
            table-layout: auto;
          }

          .items-table th,
          .items-table td { 
            border-right: 1px solid #000; 
            border-bottom: 1px solid #000; 
            font-size: 7.5pt; 
            padding: 3px 4px; 
            text-align: center; 
          }

          .items-table th:last-child,
          .items-table td:last-child {
            border-right: none;
          }

          .items-table th {
            font-weight: 900;
            border-bottom: 1px solid #000;
            white-space: nowrap;
          }

          .items-table td.left {
            text-align: left;
          }

          .blank-row td {
            border-bottom: none;
            height: 100%;
            min-height: 100px;
          }

          .remark-row { 
            display: flex; 
            justify-content: space-between; 
            border-bottom: 1px solid #000; 
            padding: 3px 6px; 
            font-size: 7.5pt; 
            font-weight: 800; 
          }

          /* --- STRICT GRID RATIOS FIXED --- */
          .bottom-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.2fr);
          }

          .gst-side {
            padding: 4px;
            border-right: 1px solid #000;
          }

          .totals-side {
            padding: 4px;
          }

          .gst-table,
          .amount-table {
            width: 100%;
            border-collapse: collapse;
          }

          .gst-table th,
          .gst-table td,
          .amount-table td {
            border: 1px solid #000;
            font-size: 7pt;
            padding: 3px 4px;
            text-align: center;
          }

          .gst-table th {
            font-weight: 900;
          }
          
          .amount-table td:first-child {
            text-align: left;
            font-weight: 700;
            width: 60%;
          }

          .amount-table td:last-child {
            text-align: right;
            font-weight: 800;
          }

          .bold-row td {
            font-weight: 900;
          }

          .grand-row td {
            font-size: 9.5pt;
            font-weight: 900;
          }

          .payment-line {
            font-size: 7pt;
            font-weight: 800;
            margin-top: 4px;
            line-height: 1.2;
          }

          .bottom-note {
            margin-top: 4px;
            font-size: 7pt;
            font-weight: 800;
            line-height: 1.3;
          }

          .words-line {
            padding: 3px 6px;
            font-size: 8pt;
            font-weight: 900;
            border-bottom: 1px solid #000;
            border-top: 1px solid #000;
          }

          .sign-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            min-height: 45px;
          }

          .sign-row > div {
            padding: 4px 6px;
            border-right: 1px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }

          .sign-row > div:last-child {
            border-right: none;
          }

          .sign-head {
            font-size: 7pt;
            font-weight: 900;
          }

        </style>
      </head>
      <body>
        ${invoiceHtml}
      </body>
      </html>
    `;

  const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});
    const page = await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1122,
      deviceScaleFactor: 2
    });

    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "6mm",
        right: "6mm",
        bottom: "6mm",
        left: "6mm"
      }
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${bill.billNumber || "invoice"}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error generating PDF");
    res.redirect("/bills");
  }
};