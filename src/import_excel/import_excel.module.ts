import { Module } from '@nestjs/common';
import { ImportExcelController } from './import_excel.controller';
import { ImportExcelService } from './import_excel.services';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { PcmsTemplateModule } from 'pcms_mc_template/pcms_template.module';
import { MasterDiscipline } from 'master_discipline/master_discipline.entity';
import { PcmsMcTemplate } from 'pcms_mc_template/pcms_template.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subsystem } from 'master_subsystem/subsystem.entity';
import { MasterModule } from 'master_module/master_module.entity';
import { MasterTypeModule } from 'master_typemodule/master_typemodule.entity';
import { PortalProject } from 'portal_project/portal_project.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      PcmsMcTemplate,
      MasterDiscipline,
      Subsystem,
      MasterTypeModule,
      MasterModule,
    ]),
    
    TypeOrmModule.forFeature([
        PortalProject,
      ],"portal")],

  controllers: [ImportExcelController],
  providers: [ImportExcelService, AesEcbService],
})
export class ImportExcelModule {}
