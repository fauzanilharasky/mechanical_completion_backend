import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { MasterReportNo } from './master_report.entity';
import { MasterReportController } from './master_report.controller';
import { MasterReportService } from './master_report.services';

@Module({
  imports: [TypeOrmModule.forFeature([MasterReportNo])],
  providers: [MasterReportService, AesEcbService],
  controllers: [MasterReportController],
  exports: [MasterReportService],
})
export class MasterReportModule {}
