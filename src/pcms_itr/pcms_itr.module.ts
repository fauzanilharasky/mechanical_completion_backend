import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { PcmsITR } from './pcms_itr.entity';
import { PcmsItrService } from './pcms_itr.services';
import { PcmsItrController } from './pcms_itr.controller';
import { MasterDiscipline } from 'master_discipline/master_discipline.entity';
import { PcmsMcTemplate } from 'pcms_mc_template/pcms_template.entity';
import { PortalUser } from 'portal_user_db/portal_user.entity';
import { MasterReportNo } from 'master_report_no/master_report.entity';
import { PortalProject } from 'portal_project/portal_project.entity';
import { PortalCompany } from 'portal_company/portal_company.entity';
import { PcmsItrChecklist } from 'pcms_itr_checklist/pcms_checklist.entity'
import { ExportModule } from 'export_excel/export_excel.module';
import { NotificationsEmailModule } from 'notifications_email/notifications_email.module';


@Module({
  imports: [TypeOrmModule.forFeature([
    PcmsITR,
    MasterDiscipline,
    PcmsMcTemplate,
    MasterReportNo,
    PcmsItrChecklist,
  ]),
  ExportModule,
  NotificationsEmailModule,
  
 TypeOrmModule.forFeature([
  PortalUser,
  PortalProject,
  PortalCompany,
], "portal")
],
  providers: [PcmsItrService, AesEcbService],
  controllers: [PcmsItrController],
})
export class PcmsItrModule {}