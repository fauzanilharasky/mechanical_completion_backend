// excel.controller.ts
import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ExcelService } from "./excel.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { MasterChecklistService } from "master_checklist/master_checklist.services";

@Controller("api/export_excel")
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly masterChecklistService: MasterChecklistService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("/export-master-checklist")
  async exportExcel(
    @Query("search") search: string,
    @Query("sort") sort: string,
    @Res() res: Response
  ) {
    const data = await this.masterChecklistService.exportList({
        
      search,
      sort,
    });

    const buffer = await this.excelService.generateExcel(
      data,
      "Master Checklist"
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=master_checklist.xlsx"
    );

    res.end(buffer);
  }
}
