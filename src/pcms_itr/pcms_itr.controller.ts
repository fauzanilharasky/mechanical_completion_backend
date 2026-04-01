import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  Query,
  Req,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Request,
  Res,
} from "@nestjs/common";
import { PcmsITR } from "./pcms_itr.entity";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ServerSideDTO } from "DTO/dto.serverside";
import { PcmsItrService } from "./pcms_itr.services";
import { AssignItrDto } from "DTO/dto.assignment_itr";
import { In } from "typeorm";
import { PcmsMcTemplate } from "pcms_mc_template/pcms_template.entity";
import { UpdateRfiDto } from "DTO/dto.submit_rfi";
import { SubmissionRfiDto } from "DTO/dto.submission_rfi";
import { GenerateExcelDto } from "DTO/dto.generate_excel";

@Controller("api/pcms_itr")
@ApiBearerAuth("access-token")
export class PcmsItrController {
  pcmsItrRepo: any;
  pcmsTemplateRepo: any;
  masterReportNoRepo: any;
  ReportRepo: any;
  constructor(private readonly pcmsItrService: PcmsItrService) { }

  @Get()
  async findAll(@Query() queryDto: ServerSideDTO) {
    return await this.pcmsItrService.findAll(queryDto);
  }

  @Get("dashboard-summary")
  async dashboardSummary(@Query() queryDto: ServerSideDTO) {
    return this.pcmsItrService.dashboardSummary(queryDto);
  }


  @Get(":id")
  findOne(@Param("id") id: number): Promise<PcmsITR> {
    return this.pcmsItrService.findOne(id);
  }

  @Post("/create")
  async create(@Body() data: Partial<PcmsITR>, @Req() req): Promise<PcmsITR> {
    return this.pcmsItrService.create(data, req.user.userId);
  }


  @Put('/assignment_user')
  async updateUser(
    @Body() dto: AssignItrDto) {
    return await this.pcmsItrService.updateUser(dto);
  }

  @ApiBearerAuth("access-token")
  @Post("/assignment_itr")
  async assignmentItr(@Body() data: Partial<AssignItrDto>): Promise<void> {
    return this.pcmsItrService.assignmentItr(data);
  }


  @Delete(":id")
  remove(@Param("id") id: number): Promise<void> {
    return this.pcmsItrService.remove(id);
  }



  @Put("/submit-rfi")
  @ApiBearerAuth("access-token")
  async updateRfi(@Body() data: UpdateRfiDto) {
    return await this.pcmsItrService.updateRfi(data);
  }

  @Put("/rejected-rfi")
  @ApiBearerAuth("access-token")
  async submitRejected(@Body() data: UpdateRfiDto) {
    return await this.pcmsItrService.submitRejected(data);
  }



  // -------------------- DOWNLOAD DATA TO FILE PDF (PENDING BY QC) --------------------------
  @Get("export_pdf/:submission_id")
  async generatepdf(
    @Param("submission_id") submission_id: string,
    @Res() res
  ) {

    const result = await this.pcmsItrService.getDetailBySubmission(submission_id);

    const rows = (Array.isArray(result?.data) ? result.data : [])
      .filter((row: any) => Number(row.status_inspection) === 3);

    // HEADER
    const header = {
      drawing_no: rows[0]?.drawing_no || "-",
      project_name: rows[0]?.project_name || "-",
      company_name: rows[0]?.company_name || "-",
      submission_id: rows[0]?.submission_id || "-",

      subsystem: rows[0]?.subsystem_rel.subsystem_name || "-",
      system: rows[0]?.system_rel.system_name || "-",
      model_no: rows[0]?.model_no || "-",
      manufacturer: rows[0]?.manufacturer || "-",
      discipline: rows[0]?.discipline_tag?.discipline_name || "-",
      serial_no: rows[0]?.serial_no || "-",
      location: rows[0]?.location || "-",
    };

    // GROUP DATA PER TAG
    const groupedData = rows.map((row: any) => {

      const items: any[] = [];

      (row.cert_rel || []).forEach((cert: any) => {
        (cert.checklist || []).forEach((check: any) => {
          items.push({
            item_no: check.item_no,
            description: check.description,
            result: check.result,
            remarks: check.remarks
          });
        });
      });

      return {
        tag_number: row.tag_number || "-",
        items
      };
    });

    const view_data = {
      header,
      groupedData
    };

    const htmlContent = this.pcmsItrService.renderTemplate(
      "export_pdf.ejs",
      view_data
    );

    const pdfBuffer = await this.pcmsItrService.generatePdf2(htmlContent);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Mechanical_completion_data.pdf"',
      "Content-Length": pdfBuffer.length
    });

    res.end(pdfBuffer);
  }


  // -------------------- DOWNLOAD DATA TO FILE PDF (PENDING BY SPV) --------------------------
  @Get("generate_pdf/:submission_id")
  async generatepdf3(
    @Param("submission_id") submission_id: string,
    @Res() res
  ) {

    const result = await this.pcmsItrService.getDetailBySubmission(submission_id);

    const rows = (Array.isArray(result?.data) ? result.data : [])
      .filter((row: any) => Number(row.status_inspection) === 1);

    // HEADER
    const header = {
      drawing_no: rows[0]?.drawing_no || "-",
      project_name: rows[0]?.project_name || "-",
      company_name: rows[0]?.company_name || "-",
      submission_id: rows[0]?.submission_id || "-",

      subsystem: rows[0]?.subsystem_rel.subsystem_name || "-",
      system: rows[0]?.system_rel.system_name || "-",
      model_no: rows[0]?.model_no || "-",
      manufacturer: rows[0]?.manufacturer || "-",
      discipline: rows[0]?.discipline_tag?.discipline_name || "-",
      serial_no: rows[0]?.serial_no || "-",
      location: rows[0]?.location || "-",
    };

    // GROUP DATA PER TAG
    const groupedData = rows.map((row: any) => {

      const items: any[] = [];

      (row.cert_rel || []).forEach((cert: any) => {
        (cert.checklist || []).forEach((check: any) => {
          items.push({
            item_no: check.item_no,
            description: check.description,
            result: check.result,
            remarks: check.remarks
          });
        });
      });

      return {
        tag_number: row.tag_number || "-",
        items
      };
    });

    const view_data = {
      header,
      groupedData
    };

    const htmlContent = this.pcmsItrService.renderTemplate(
      "export_pdf.ejs",
      view_data
    );

    const pdfBuffer = await this.pcmsItrService.generatePdf2(htmlContent);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Mechanical_completion_data.pdf"',
      "Content-Length": pdfBuffer.length
    });

    res.end(pdfBuffer);
  }



  // -------------------- DOWNLOAD DATA TO FILE PDF (PENDING BY ClIENT) --------------------------
  @Get("download_pdf/:submission_id")
  async generatepdf4(
    @Param("submission_id") submission_id: string,
    @Res() res
  ) {

    const result = await this.pcmsItrService.getDetailBySubmission(submission_id);

    const rows = (Array.isArray(result?.data) ? result.data : [])
      .filter((row: any) => Number(row.status_inspection) === 6);

    // HEADER
    const header = {
      drawing_no: rows[0]?.drawing_no || "-",
      project_name: rows[0]?.project_name || "-",
      company_name: rows[0]?.company_name || "-",
      submission_id: rows[0]?.submission_id || "-",

      subsystem: rows[0]?.subsystem_rel.subsystem_name || "-",
      system: rows[0]?.system_rel.system_name || "-",
      model_no: rows[0]?.model_no || "-",
      manufacturer: rows[0]?.manufacturer || "-",
      discipline: rows[0]?.discipline_tag?.discipline_name || "-",
      serial_no: rows[0]?.serial_no || "-",
      location: rows[0]?.location || "-",
    };

    // GROUP DATA PER TAG
    const groupedData = rows.map((row: any) => {

      const items: any[] = [];

      (row.cert_rel || []).forEach((cert: any) => {
        (cert.checklist || []).forEach((check: any) => {
          items.push({
            item_no: check.item_no,
            description: check.description,
            result: check.result,
            remarks: check.remarks
          });
        });
      });

      return {
        tag_number: row.tag_number || "-",
        items
      };
    });

    const view_data = {
      header,
      groupedData
    };

    const htmlContent = this.pcmsItrService.renderTemplate(
      "export_pdf.ejs",
      view_data
    );

    const pdfBuffer = await this.pcmsItrService.generatePdf2(htmlContent);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Mechanical_completion_data.pdf"',
      "Content-Length": pdfBuffer.length
    });

    res.end(pdfBuffer);
  }




  // -------------------- DOWNLOAD DATA TO FILE PDF (APPROVE BY ClIENT) --------------------------
  @Get("export/:submission_id")
  async generatepdf1(
    @Param("submission_id") submission_id: string,
    @Res() res
  ) {

    const result = await this.pcmsItrService.getDetailBySubmission(submission_id);

    const rows = (Array.isArray(result?.data) ? result.data : [])
      .filter((row: any) => Number(row.status_inspection) === 8);

    // HEADER
    const header = {
      drawing_no: rows[0]?.drawing_no || "-",
      project_name: rows[0]?.project_name || "-",
      company_name: rows[0]?.company_name || "-",
      submission_id: rows[0]?.submission_id || "-",

      subsystem: rows[0]?.subsystem_rel.subsystem_name || "-",
      system: rows[0]?.system_rel.system_name || "-",
      model_no: rows[0]?.model_no || "-",
      manufacturer: rows[0]?.manufacturer || "-",
      discipline: rows[0]?.discipline_tag?.discipline_name || "-",
      serial_no: rows[0]?.serial_no || "-",
      location: rows[0]?.location || "-",
    };

    // GROUP DATA PER TAG
    const groupedData = rows.map((row: any) => {

      const items: any[] = [];

      (row.cert_rel || []).forEach((cert: any) => {
        (cert.checklist || []).forEach((check: any) => {
          items.push({
            item_no: check.item_no,
            description: check.description,
            result: check.result,
            remarks: check.remarks
          });
        });
      });

      return {
        tag_number: row.tag_number || "-",
        items
      };
    });

    const view_data = {
      header,
      groupedData
    };

    const htmlContent = this.pcmsItrService.renderTemplate(
      "export_pdf.ejs",
      view_data
    );

    const pdfBuffer = await this.pcmsItrService.generatePdf2(htmlContent);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Mechanical_completion_data.pdf"',
      "Content-Length": pdfBuffer.length
    });

    res.end(pdfBuffer);
  }



  // GET DETAILS DATA IN THE RFI SUBMISSION

  @Get("/rfi-submission/:submission_id")
  async getDetailBySubmission(@Param("submission_id") submissionId: string) {
    return await this.pcmsItrService.getDetailBySubmission(submissionId);
  }

  @Get("/summary_details/:submission_id")
  async getSummaryDetails(@Param("submission_id") submissionId: string) {
    return await this.pcmsItrService.getSummaryDetails(submissionId);
  }


  @Get("/details/:submission_id")
  async rejectDetailSpv(@Param("submission_id") submissionId: string) {
    return await this.pcmsItrService.rejectDetailSpv(submissionId);
  }

  @Put('/transmittal')
  async updateTransmit(
    @Body() dto: UpdateRfiDto[]) {
    return await this.pcmsItrService.updateTransmit(dto);
  }


}
