import { Module } from '@nestjs/common';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterChecklist } from 'master_checklist/master_checklist.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { MasterChecklistModule } from 'master_checklist/master_checklist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        MasterChecklist
    ]),
    MasterChecklistModule,
  ],
  controllers: [ExcelController],
  providers: [ExcelService, AesEcbService],
 
})
export class ExcelModule {}
