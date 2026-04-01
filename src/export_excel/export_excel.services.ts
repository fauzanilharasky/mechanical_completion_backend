import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';


export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelColumnStyle {
  font?: Partial<ExcelJS.Font>;
  alignment?: Partial<ExcelJS.Alignment>;
  fill?: Partial<ExcelJS.Fill>;
  border?: Partial<ExcelJS.Borders>;
  numFmt?: string;
}

export interface ExcelStyleOptions {
  headerFont?: Partial<ExcelJS.Font>;
  headerAlignment?: Partial<ExcelJS.Alignment>;
  headerFill?: Partial<ExcelJS.Fill>;
  headerBorder?: Partial<ExcelJS.Borders>;

  rowFont?: Partial<ExcelJS.Font>;
  rowAlignment?: Partial<ExcelJS.Alignment>;

  striped?: boolean;

  columnStyles?: Record<string, ExcelColumnStyle>;

  hyperlinkColumns?: string[];
}

export interface ExcelGenerateOptions {
  sheetName?: string;
  columns: ExcelColumn[];
  rows: any[];
  styleOptions?: ExcelStyleOptions;
  autoNumber?: boolean;
  freezeHeader?: boolean;
  title?: string;
  striped?: boolean;
}


@Injectable()
export class ExportService {
  async generateExcel(data: any[], sheetName = 'Sheet1'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map((key) => ({
        header: key.toUpperCase(),
        key: key,
        width: 20,
      }));
      data.forEach((item) => worksheet.addRow(item));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  //helper excel with
  async generateExcelStyle({
    sheetName = "Sheet 1",
    columns,
    rows,
    styleOptions = {},
    autoNumber = true,
    freezeHeader = true,
    title,
  }: ExcelGenerateOptions): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // ---------------------
    // AUTO NUMBER COLUMN
    // ---------------------
    if (autoNumber) {
      columns = [{ header: "No", key: "_no", width: 6 }, ...columns];
    }

    worksheet.columns = columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 20,
    }));

    const headerRowIndex = worksheet.lastRow.number;
    const headerRow = worksheet.getRow(headerRowIndex);

    // ---------------------
    // HEADER STYLING
    // ---------------------
    headerRow.font = styleOptions.headerFont || { bold: true };
    headerRow.alignment = styleOptions.headerAlignment || { horizontal: "center" };

    headerRow.eachCell((cell) => {
      cell.fill = (styleOptions.headerFill as ExcelJS.Fill) || {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDDEBF7" },
      };

      cell.border = styleOptions.headerBorder || {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    rows.forEach((row, index) => {
      const addedRow = worksheet.addRow({ _no: index + 1, ...row });

      addedRow.eachCell((cell, colNumber) => {

        const colKey = worksheet.getColumn(colNumber).key;

        // Hyperlink
        if (styleOptions.hyperlinkColumns?.includes(colKey) && typeof row[colKey] === "string") {

          cell.value = {
            text: 'Click Here',
            hyperlink: row[colKey],
          };

          // Default style hyperlink
          cell.font = {
            color: { argb: "FF0000FF" },
            underline: true,
            bold: false,
            ...cell.font
          };
        }

        // GLOBAL ROW STYLE
        if (styleOptions.rowFont) cell.font = styleOptions.rowFont;
        if (styleOptions.rowAlignment) cell.alignment = styleOptions.rowAlignment;

        // STRIPING
        if (styleOptions.striped && index % 2 === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF7F7F7" },
          };
        }

        if (row.__style && row.__style[colKey]) {
          const dyn = row.__style[colKey];
          if (dyn.font) cell.font = { ...cell.font, ...dyn.font };
          if (dyn.alignment) cell.alignment = { ...cell.alignment, ...dyn.alignment };
          if (dyn.fill) cell.fill = dyn.fill;
          if (dyn.border) cell.border = dyn.border;
        }


        // 🎯 PER-COLUMN CUSTOM STYLE
        if (styleOptions.columnStyles && styleOptions.columnStyles[colKey]) {
          const colStyle = styleOptions.columnStyles[colKey];

          if (colStyle.font) cell.font = { ...cell.font, ...colStyle.font };
          if (colStyle.alignment) cell.alignment = { ...cell.alignment, ...colStyle.alignment };

          if (colStyle.fill) cell.fill = colStyle.fill as ExcelJS.Fill;

          if (colStyle.border) cell.border = colStyle.border;
        }

      });

    });


    // ---------------------
    // STRIPED ROWS + BORDER
    // ---------------------
    worksheet.eachRow((row, rowNum) => {
      if (rowNum > headerRowIndex) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };

          if (styleOptions.striped && rowNum % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "00000" },
            };
          }
        });
      }
    });

    // ---------------------
    // FREEZE HEADER
    // ---------------------
    if (freezeHeader) {
      worksheet.views = [{ state: "frozen", ySplit: headerRowIndex }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
