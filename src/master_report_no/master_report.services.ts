import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterReportNo } from './master_report.entity';

@Injectable()
export class MasterReportService {
  constructor(
    @InjectRepository(MasterReportNo)
    private readonly ReportRepo: Repository<MasterReportNo>,
  ) {}

}
