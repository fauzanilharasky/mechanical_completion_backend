import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PcmsTemplateService } from './pcms_template.services';
import { PcmsTemplateController } from './pcms_template.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { PcmsMcTemplate } from './pcms_template.entity';
import { MasterDiscipline } from 'master_discipline/master_discipline.entity';
import { Subsystem } from 'master_subsystem/subsystem.entity';
import { MasterTypeModule } from 'master_typemodule/master_typemodule.entity';
import { PortalProject } from 'portal_project/portal_project.entity';
import { PortalCompany } from 'portal_company/portal_company.entity';
import { MasterModule } from 'master_module/master_module.entity';
import { ImportExcelService } from 'import_excel/import_excel.services';
import { PcmsITR } from 'pcms_itr/pcms_itr.entity';
import { PortalUser } from 'portal_user_db/portal_user.entity';
import { MasterReportNo } from '../master_report_no/master_report.entity';
import { ExportModule } from 'export_excel/export_excel.module';
import { ExcelModule } from 'excel/excel.module';
import { PortalUserPermissionModule } from 'portal_permission/module/portal_permission.module';



@Module({
  imports: [
    TypeOrmModule.forFeature([
      PcmsMcTemplate,
      MasterDiscipline,
      Subsystem,
      MasterReportNo,
      MasterTypeModule,
      MasterModule,
      PcmsITR,
    ]),
    ExportModule,

  TypeOrmModule.forFeature([
    PortalProject,
    PortalCompany,
    PortalUser
  ],"portal"),

  PortalUserPermissionModule
],


  providers: [PcmsTemplateService, AesEcbService],
  controllers: [PcmsTemplateController],
})
export class PcmsTemplateModule { }
