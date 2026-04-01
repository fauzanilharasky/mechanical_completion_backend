import { Controller, Get, Post, Param, Body, Put, Delete, Query, Req, InternalServerErrorException, Res, UseGuards } from '@nestjs/common';
import { PcmsMcTemplate } from './pcms_template.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { PcmsTemplateService } from './pcms_template.services';
import { MasterModuleService } from 'master_module/master_module.services';
import { ExportService } from './../export_excel/export_excel.services';
import { count } from 'console';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerateExcelDto } from 'DTO/dto.generate_excel';
import { FitupExcelDto } from 'DTO/dto.fitup_excel';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { Permission } from 'portal_permission/decorator/portal_permission.decorator';


@UseGuards(PermissionGuard)
@Controller('api/pcms_mc_template')
@ApiBearerAuth('access-token')
export class PcmsTemplateController {
  [x: string]: any;
  repo: any;
  MasterModuleRepo: any;
  disciplineRepo: any;
  typeModuleRepo: any;
  subsystemRepo: any;
  projectRepo: any;

  constructor(
    private readonly pcmsTemplateService: PcmsTemplateService,

    private readonly exportService: ExportService,
  ) { }


  @Get()
  async findAll(@Query() queryDto: ServerSideDTO) {
    return await this.pcmsTemplateService.findAll(queryDto);
  }




  // ------------------ EXPORT EXCEL (ITR ASSIGNMENT) -------------------

  @Post("/export_excel")
  async exportExcel(@Body() dto: GenerateExcelDto, @Res() res) {
    const buffer = await this.pcmsTemplateService.generate_excel(dto);

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Pcms_Itr_Assignment.xlsx"`,
      "Content-Length": buffer.length,
    });

    return res.send(buffer);
  }


  // ------------------ EXPORT EXCEL (TAG NUMBER) -------------------
  @Post("/export_to_excel")
  async exportToExcel(@Body() dto: GenerateExcelDto, @Res() res) {
    const buffer = await this.pcmsTemplateService.export_excel(dto);

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Pcms_Tag_Register.xlsx"`,
      "Content-Length": buffer.length,
    });

    return res.send(buffer);
  }




  @Get("dropdown-data")
  async getDropdownData() {
    return this.pcmsTemplateService.getDropdownData();
  }


  @Get(':id')
  findOne(@Param('id') id: number): Promise<PcmsMcTemplate> {
    return this.pcmsTemplateService.findOne(id);
  }


  @Post('/create')
  async create(@Body() data: Partial<PcmsMcTemplate>, @Req() req): Promise<PcmsMcTemplate> {
    return this.pcmsTemplateService.create(data, req.user.userId);
  }

  @Permission([17, 19])
  @Post('/assignment_list')
  async getAssignmentList(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.getAssignmentList(queryDto);
    return data;
  }


  //  --------------- Rejected ---------------------
  @Permission([20])
  @Post('/rejected_list')
  async getRejectedList(@Query() QueryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.getRejectedList(QueryDto);
    return data;
  }

  @Permission([26])
  @Post('/rejected_qc')
  async getRejectedQc(@Query() QueryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.getRejectedQc(QueryDto);
    return data;
  }

  @Permission([31])
  @Post('/rejected_client')
  async getRejectedClient(@Query() QueryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.getRejectedClient(QueryDto);
    return data;
  }


  @Get('filter-options')
  async getFilterOptions() {
    return this.pcmsTemplateService.getFilterOptions();
  }


  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<PcmsMcTemplate>): Promise<PcmsMcTemplate> {
    return this.pcmsTemplateService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.pcmsTemplateService.remove(id);
  }

  @Permission([16])
  @Post('/serverside_list')
  async serverSideList(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.serverSideList(queryDto);
    return data;
  }

  @Post('/edit_itr')
  async editItr(@Body('ids') ids: number[]): Promise<PcmsMcTemplate[]> {
    return this.pcmsTemplateService.findByIds(ids);
  }

   @Permission([13])
  @Post('/numbers_list')
  async numbersList(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.numbersList(queryDto);
    return data;
  }


  @Post('/bulk_find')
  async bulkFind(@Body('ids') ids: number[]): Promise<PcmsMcTemplate[]> {
    return this.pcmsTemplateService.findByIds(ids);
  }


  // --------------------- APPROVE DATA ------------------------
  @Permission([21])
  @Post('/inspection_rfi')
  async inspectionRFI(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.inspectionRFI(queryDto);
    return data;
  }

  @Permission([28])
  @Post('/transmittal_qc')
  async transmittalQc(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.transmittalQc(queryDto);
    return data;
  }

  @Permission([33])
  @Post('/approve_client')
  async approvalClient(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.approvalClient(queryDto);
    return data;
  }



  //  ------------------ PENDING ------------------
  @Permission([24])
  @Post('/pending_Qc')
  async pendingQc(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.pendingQc(queryDto);
    return data;
  }

  @Permission([29])
  @Post('/pending_client')
  async pendingClient(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.pendingClient(queryDto);
    return data;
  }

   @Permission([38])
  @Post('/pending_review')
  async pendingReview(@Body() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.pendingReview(queryDto);
    return data;
  }

  @Post("/export_fitup")
  async fitupExcel(@Body() dto: FitupExcelDto, @Res() res) {
    const buffer = await this.pcmsTemplateService.exportReport(dto);

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="export_report_MC.xlsx"`,
      "Content-Length": buffer.length,
    });

    return res.send(buffer);
  }

  @Permission([35])
  @Post('/summary_rfi')
  async summaryRfi(@Query() queryDto: ServerSideDTO) {
    const data = await this.pcmsTemplateService.summaryRfi(queryDto);
    return data;
  }


}

function timestampFileName() {
  throw new Error('Function not implemented.');
}
