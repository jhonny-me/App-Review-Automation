const ExcelJS = require("exceljs");

module.exports = {
  createWorkbook: () => new ExcelJS.Workbook(),

  addSheet: (workbook, name, data, columns) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns;
    data.forEach((item) => sheet.addRow(item));
    // Style the header row
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    return workbook;
  },

  saveWorkbook: async (workbook, filePath) => {
    await workbook.xlsx.writeFile(filePath);
  },

  formatDate: (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  },

  commonColumns: [
    { header: "Version", key: "version", width: 10 },
    { header: "Author", key: "author", width: 15 },
    { header: "Date", key: "date", width: 12 },
    { header: "Rating", key: "rating", width: 8 },
    { header: "Title", key: "title", width: 25 },
    { header: "Review", key: "review", width: 50 },
    { header: "Translated Review", key: "translatedReview", width: 50 },
    { header: "Country", key: "country", width: 12 },
    { header: "Developer Reply", key: "developerReply", width: 50 },
    { header: "Reply Date", key: "replyDate", width: 12 },
  ],
};
