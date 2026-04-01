import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  StreamableFile,
  Res,
  InternalServerErrorException,
  BadRequestException,
  Req,} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ExportService } from "./export_excel.services";

@Controller('api/excel')
export class ExportController {
  constructor(private readonly exportService: ExportService) { }

  @Get('export')
  async exportExcel(@Res() res) {
    const data = [
      { id: 1, name: 'John Doe', age: 25 },
      { id: 2, name: 'Jane Smith', age: 30 },
    ];
    const buffer = await this.exportService.generateExcel(data, 'Users');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.end(buffer);
  }

  @Get("/export/style")
  async exportExcelStyle(@Res() res) {
    const buffer = await this.exportService.generateExcelStyle({
      // title: "List",
      sheetName: "Report",
      columns: [
        { header: "Name", key: "name", width: 30 },
        { header: "Booking", key: "booking_date", width: 20 },
      ],
      rows: [
        { name: "John Doe", booking_date: "2025-11-30" },
        { name: "Jane Smith", booking_date: "2025-12-01" },
      ],  
    });

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="booking_report_${Date.now()}.xlsx"`,
      "Content-Length": buffer.length,
    });

    return res.send(buffer);
  }
}


