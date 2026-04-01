// excel.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AesEcbService } from "crypto/aes-ecb.service";
import * as ExcelJS from "exceljs";
import { MasterChecklist } from "master_checklist/master_checklist.entity";
import { Repository } from "typeorm";

@Injectable()
export class ExcelService {

constructor(

    @InjectRepository(MasterChecklist)
    private readonly masterChecklistRepo: Repository<MasterChecklist>,
    private readonly esEcbService: AesEcbService,
    ) { }
    


  async generateExcel(
    data: any[],
    sheetName = "Sheet1"
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (!data.length) {
      worksheet.addRow(["No data available"]);
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    }

    const headers = Object.keys(data[0]).map((key) => ({
      header: key.replace(/_/g, " ").toUpperCase(),
      key,
      width: 25,
    }));

    worksheet.columns = headers;

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }





}
