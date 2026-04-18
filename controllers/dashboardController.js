const Bill = require("../models/Bill");
const Product = require("../models/Product");
const ExcelJS = require("exceljs");

exports.dashboardPage = async (req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

    // total revenue
    const totalRevenueResult = await Bill.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    const totalRevenue = totalRevenueResult.length ? totalRevenueResult[0].total : 0;

    // today revenue
    const todayRevenueResult = await Bill.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: startOfToday, $lt: endOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    const todayRevenue = todayRevenueResult.length ? todayRevenueResult[0].total : 0;

    // month revenue
    const monthRevenueResult = await Bill.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    const monthRevenue = monthRevenueResult.length ? monthRevenueResult[0].total : 0;

    // year revenue
    const yearRevenueResult = await Bill.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: startOfYear, $lt: startOfNextYear }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    const yearRevenue = yearRevenueResult.length ? yearRevenueResult[0].total : 0;

    // product stats
    const totalProducts = await Product.countDocuments();

    const lowStockCount = await Product.countDocuments({
      quantity: { $lt: 10 }
    });

    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const expiringCount = await Product.countDocuments({
      expiryDate: {
        $gte: now,
        $lte: sixMonthsLater
      }
    });

    // day-wise revenue chart
    const dailySalesRaw = await Bill.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" }
          },
          total: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ]);

    const chartLabels = dailySalesRaw.map(item => {
      const day = String(item._id.day).padStart(2, "0");
      const month = String(item._id.month).padStart(2, "0");
      const year = item._id.year;
      return `${day}/${month}/${year}`;
    });

    const chartData = dailySalesRaw.map(item => item.total);

   res.render("dashboard/index", {
  active: "dashboard",
  totalRevenue,
  todayRevenue,
  monthRevenue,
  yearRevenue,
  totalProducts,
  lowStockCount,
  expiringCount,
  chartLabels,
  chartData
});
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error loading dashboard");
    res.redirect("/dashboard");
  }
};

exports.downloadMonthlySalesExcel = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      req.flash("error_msg", "Please select month and year");
      return res.redirect("/dashboard");
    }

    const monthNum = Number(month);
    const yearNum = Number(year);

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    const bills = await Bill.find({
      isDeleted: false,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ date: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Sales");

    worksheet.columns = [
      { header: "Bill No", key: "billNumber", width: 18 },
      { header: "Buyer Name", key: "buyerName", width: 25 },
      { header: "Date", key: "date", width: 18 },
      { header: "Items Count", key: "itemsCount", width: 15 },
      { header: "Total Amount", key: "totalAmount", width: 18 }
    ];

    bills.forEach(bill => {
      worksheet.addRow({
        billNumber: bill.billNumber || bill._id.toString().slice(-6).toUpperCase(),
        buyerName: bill.buyer?.name || "",
        date: new Date(bill.date).toLocaleDateString(),
        itemsCount: bill.items.length,
        totalAmount: Number(bill.totalAmount).toFixed(2)
      });
    });

    worksheet.getRow(1).font = { bold: true };

    const fileName = `monthly-sales-${month}-${year}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Error downloading monthly sales file");
    res.redirect("/dashboard");
  }
};