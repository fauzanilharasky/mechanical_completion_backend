import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterChecklist } from '../master_checklist/master_checklist.entity';
import { MasterChecklistService } from '../master_checklist/master_checklist.services';
import { MasterChecklistController } from '../master_checklist/master_checklist.controller';

import { AesEcbService } from 'crypto/aes-ecb.service';
import { MasterForm } from 'master_form/master_form.entity';
@Module({
  imports: [TypeOrmModule.forFeature([MasterChecklist, MasterForm])],
  providers: [MasterChecklistService,  AesEcbService],
  controllers: [MasterChecklistController],
   exports: [MasterChecklistService],
})
export class MasterChecklistModule {}
