const puppeteer = require('puppeteer');
require('dotenv').config();
const fs = require('fs');
const path = require("path");

const downloadReport = async (data, res) => {
  try {
    console.log("Starting PDF generation");

     if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).send("No records found to generate PDF.");
    }

    const isBooking = !!data[0].bookId;
    const reportType = isBooking ? "Booking Report" : "Referral Report";

    const formatDate = (date) => {
      if (!date) return "-";
      const d = new Date(date);
      if (isNaN(d)) return "-";
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()} ${d
        .getHours()
        .toString()
        .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    // Generate table rows dynamically for all records
    const tableRows = data
      .map(
        (record, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${record.bookId || record.refId || "-"}</td>
        <td>${record.name || "-"}</td>
        <td>${record.user?.name || "-"}</td>
        <td>${isBooking ? record.bookedByUser?.name || "-" : record.refferedByUser?.name || "-"}</td>
        <td>${record.loantype?.type || "-"}</td>
        <td>${isBooking ? record.loanAccountNumber || "-" : "-"}</td>
        <td>${record.loanAmount || record.bookingAmount || "-"}</td>
        <td>${record.tentativeBillAmount || "-"}</td>
        <td>${record.status?.status || "-"}</td>
        <td>${record.address || "-"}</td>
        <td>${record.remark || "-"}</td>
        <td>${formatDate(record.createdAt)}</td>
      </tr>`
      )
      .join("");
    
    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${reportType}</title>
  <style>
    body {
      font-family: "Segoe UI", sans-serif;
      margin: 30px;
      color: #333;
      background-color: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      color: #007bff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      word-break: break-word;
    }
    th {
      background-color: #f4f8ff;
      color: #007bff;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #888;
      border-top: 1px solid #ddd;
      padding-top: 10px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${reportType}</h1>
    <p>Generated on: ${formatDate(new Date())}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>${isBooking ? "Booking ID" : "Referral ID"}</th>
        <th>Name</th>
        <th>User</th>
        <th>${isBooking ? "Booked By" : "Referred By"}</th>
        <th>Loan Type</th>
        <th>${isBooking ? "Loan Account Number" : "-"}</th>
        <th>Loan Amount</th>
        <th>Tentative Bill Amount</th>
        <th>Status</th>
        <th>Address</th>
        <th>Remark</th>
        <th>Created Date</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <p>© ${new Date().getFullYear()} F2G | Auto-generated document</p>
  </div>
</body>
</html>
`;
    // const browser = await puppeteer.launch({ headless: false, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    // args: ["--no-sandbox", "--disable-setuid-sandbox"], });

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/google-chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
	, '--disable-gpu'
        ]});

    const page = await browser.newPage();

    await page.setContent(htmlContent);
            await page.emulateMediaType('screen');
            const pdfBuffer = await page.pdf({
                path: 'debug-report1.pdf',
                format: 'A4',
                printBackground: true
            });
      // Close Puppeteer browser
    await browser.close();

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Failed to generate PDF. Buffer is empty.");
    }

   console.log(__dirname)
   let tempPath = path.join(`${__dirname}/output-report.pdf`);

    fs.writeFileSync(tempPath, pdfBuffer);

    let readMergedData = fs.readFileSync(tempPath);
    this.logger?.log("Deleting Merged File output-merged "+randomInt+".pdf" )

   let headers = {
      'content-type': 'application/pdf',
      'cache-control': 'public,max-age=31536000',
      "Content-Disposition": `attachment; filename=${reportType === "Booking Report" ? 'booking_report' : reportType === "Referral Report" ? 'refferal_report' : 'report.pdf'}_${Date.now()}.pdf`
    }
  
    res.set(headers);
    res.send(readMergedData);
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("An error occurred while generating the PDF.");
  }
};

module.exports = { downloadReport };
