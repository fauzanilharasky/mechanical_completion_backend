import { MasterReportNo } from './master_report.entity';
import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MasterReportService } from './master_report.services';

@Controller('api/master_report')
@ApiBearerAuth('access-token')
export class MasterReportController {
  constructor(private readonly MasterReportService: MasterReportService) {}







}