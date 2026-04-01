import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterForm } from '../master_form/master_form.entity';
import { MasterFormService } from '../master_form/master_form.services';
import { MasterFormController } from './master_form.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { MasterPhase } from 'master_phase/master_phase.entity';
import { MasterDiscipline } from 'master_discipline/master_discipline.entity';
import { PortalUserPermissionModule } from 'portal_permission/module/portal_permission.module';

@Module({
  imports: [TypeOrmModule.forFeature([MasterForm, MasterPhase, MasterDiscipline]),
  PortalUserPermissionModule
],
  providers: [MasterFormService, AesEcbService],
  controllers: [MasterFormController],
  exports:[MasterFormService]
})
export class MasterFormModule {}
