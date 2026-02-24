import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Job } from "@/app/history/page";
import { Timestamp } from "firebase/firestore";

// --- TYPE GUARD FOR FIREBASE TIMESTAMP ---
const isFirebaseTimestamp = (value: unknown): value is Timestamp => {
  return value != null && typeof value === "object" && "toDate" in value;
};

// --- HELPER: AUTO-FIT COLUMNS ---
const autoFitColumns = (worksheet: ExcelJS.Worksheet) => {
  worksheet.columns.forEach((column) => {
    let maxLength = 0;

    // Iterate over all cells in this column
    if (column?.eachCell) {
      column.eachCell({ includeEmpty: true }, (cell) => {
      // Skip the Title Row (Row 1) to prevent it from stretching Column A
      if (Number(cell.row) === 1) return;

      const cellValue = cell.value ? cell.value.toString() : "";
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });

    // Set width (minimum 10, plus a little padding)
    if (column) {
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    }
      }
  });
};

const setupWorksheet = (worksheet: ExcelJS.Worksheet, title: string) => {
  // =========================
  // 1. TITLE ROW (Dark Grey)
  // =========================
  worksheet.mergeCells("A1:I1");

  const titleCell = worksheet.getCell("A1");
  titleCell.value = title;

  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: "fff3cccb" }, // pink font
  };

  titleCell.alignment = {
    horizontal: "left",
    vertical: "middle",
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "ff666666" }, // Dark Grey
  };

  worksheet.getRow(1).height = 28;

  // =========================
  // 2. COLUMN HEADERS (Black)
  // =========================
  const headerRow = worksheet.addRow([
    "COMPANY NAME",
    "INVOICE NO",
    "JOB VALUE",
    "LOCATION",
    "DELIEVERED BY",
    "FEDEX",
    "Logistic",
    "SALES TEAM",
    "Payment",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Arial",
      bold: true,
      size: 11,
      color: { argb: "FFFFFFFF" }, // White text
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" }, // Black background
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  });
  
};

// --- SHARED HELPER: ADD DATA ROWS ---
const addDataRows = (worksheet: ExcelJS.Worksheet, jobs: Job[]) => {
  jobs.forEach((job) => {
    const row = worksheet.addRow([
      job.client,
      job.invoiceNo,
      job.amount,
      job.location,
      job.salesPerson,
      job.deliveryType,
      job.driver || "",
      job.salesPerson,
      job.paymentInfo,
    ]);

    // Apply Borders and Font to data cells
    row.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11 };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }, // White
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });
};

// ==========================================
// 1. ORIGINAL FULL EXPORT (History Page)
// ==========================================
export const generateHistoryExcel = async (jobs: Job[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Full History");

  setupWorksheet(worksheet, `LOGISTICS REPORT - FULL HISTORY`);
  addDataRows(worksheet, jobs);
  
  // Apply Dynamic Widths
  autoFitColumns(worksheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(
    blob,
    `History_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
};

// ==========================================
// 2. DAILY REPORT (Today Only + Extra Lines)
// ==========================================
export const generateDailyExcel = async (allJobs: Job[]) => {
  // A. Filter for TODAY
  const todayStr = new Date().toDateString();

  const dailyJobs = allJobs.filter((job) => {
    if (job.status !== "Completed") return false;

    // Handle Firebase Timestamp or standard Date
    let jobDate: Date | null = null;
    if (isFirebaseTimestamp(job.completedAt)) {
      jobDate = job.completedAt.toDate();
    } else if (typeof job.completedAt === "string" || typeof job.completedAt === "number") {
      jobDate = new Date(job.completedAt);
    } else if (job.completedAt != null && (job.completedAt as object) instanceof Date) {
      jobDate = job.completedAt as Date;
    }

    if (!jobDate) return false;
    return jobDate.toDateString() === todayStr;
  });

  if (dailyJobs.length === 0) {
    throw new Error("No completed jobs found for today.");
  }

  // B. Setup Workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Daily Report");

  setupWorksheet(
    worksheet,
    `LOGISTICS REPORT - ${new Date().toLocaleDateString()}`,
  );
  addDataRows(worksheet, dailyJobs);

  // Apply Dynamic Widths NOW (Before adding the footer lines)
  // This ensures the long footer text doesn't skew Column A's width calculation
  autoFitColumns(worksheet);

  // C. Add the 3 Specific Footer Lines
  // We add an empty row first for spacing
  worksheet.addRow([]);

  const footerLines = [
    "Salem - Drop job - TPP Al Quisaisa",
    "Pradeep - Collect UV Job from Cosmo Printing",
    "Salem - Dsoa Shuttle - 8.30AM & 3PM & 6PM",
  ];

  footerLines.forEach((text) => {
    const row = worksheet.addRow([text]);

    // Merge first few cells so text is visible
    worksheet.mergeCells(`A${row.number}:E${row.number}`);

    const cell = row.getCell(1);
    cell.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FF555555" },
    };
    cell.alignment = { horizontal: "left" };
  });

  // D. Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Daily_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
};