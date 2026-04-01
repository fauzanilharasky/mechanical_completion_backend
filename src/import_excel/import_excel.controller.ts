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
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImportExcelService } from "./import_excel.services";
import { createReadStream } from "fs";
import { Response } from "express";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("api/import_excel")
export class ImportExcelController {
  repo: any;
  constructor(private readonly importExcelService: ImportExcelService) {
    
  }

  /**
   * Upload Excel untuk dibaca sementara (preview)
   */
   @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(xls|xlsx)$/)) {
          return cb(new Error("Only Excel files are allowed"), false);
        }
        cb(null, true);
      },
    })
  )
  async upload(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    return this.importExcelService.handleUpload(file.buffer);
  }


  /**
   * Download template Excel
   */
  @Get("template")
  async downloadTemplate(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const file = await this.importExcelService.generateTemplate();
    const fileStream = createReadStream(file.path);
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${file.name}"`,
    });
    return new StreamableFile(fileStream);
  }

 @Post('/import')
async importRecords(@Body() body) {
  const { records, userId } = body;

  if (!records || !Array.isArray(records)) {
    throw new BadRequestException('No records to import');
  }

  const mapped = records.map(r =>
    this.repo.create({
      tag_number: r['Tag Number'] || r.tag_number,
      tag_description: r['Description'] || r.tag_description,
      created_by: userId,
    })
  );

  await this.repo.save(mapped);
  return { message: 'Imported successfully', count: mapped.length };
}

// ----------- confirm -------------
@Post("/confirm")
@ApiBearerAuth("access-token")
async confirmImport(
  @Req() req,
  @Body("sessionId") sessionId: string
) {
  const userId = req.user.id;
  return this.importExcelService.saveImportedData(userId, sessionId);
}



  /**
   * Download hasil import berdasarkan sessionId
   */
  @Get("download/:id")
  async downloadResult(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.importExcelService.getResultFile(id);
    const fileStream = createReadStream(file.path);
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${file.name}"`,
    });
    return new StreamableFile(fileStream);
  }

  /**
   * Ambil data preview (kalau ingin reload tanpa upload ulang)
   */
  @Get("preview/:sessionId")
  async getPreview(@Param("sessionId") sessionId: string) {
    return this.importExcelService.getPreview(sessionId);
  }
}
