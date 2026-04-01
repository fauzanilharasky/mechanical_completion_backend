import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SftpModule } from './sftp/sftp.module';
import { ExcelModule } from './excel/excel.module';
import { PdfModule } from './pdf/pdf.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './portal/user.module';
import { BookingModule } from './bookings/booking.module';
import { CryptoModule } from './crypto/crypto.module'; 
import { SubsystemModule } from './master_subsystem/subsystem.module';

import { MasterFormModule } from 'master_form/master_form.module';
import { PortalUserModule } from 'portal_user_db/portal_user.module';
import { MasterChecklistModule } from './master_checklist/master_checklist.module';
import { MasterSystemModule } from 'master_system/master_system.module';
import { MasterPhase } from 'master_phase/master_phase.entity';
import { MasterPhaseModule } from 'master_phase/master_phase.module';
import { MasterDisciplineModule} from 'master_discipline/master_discipline.module';
import { MasterDiscipline } from 'master_discipline/master_discipline.entity';
import { MasterSystem } from 'master_system/entities/master_system.entity';
import { MasterForm } from 'master_form/master_form.entity';
import { PcmsTemplateModule } from 'pcms_mc_template/pcms_template.module';
import { PortalProject } from 'portal_project/portal_project.entity';
import { MasterModulee } from 'master_module/master_module.module';
import { CompanyModule } from 'portal_company/portal_company.module';
import { PcmsItrModule } from 'pcms_itr/pcms_itr.module';
import { MasterLocationModule } from 'master_location_v2/master_location.module';
import { ImportExcelModule } from 'import_excel/import_excel.module';
import { MasterTypeOfModule } from 'master_typemodule/master_typemodule.module';
import { MasterReportModule } from 'master_report_no/master_report.module';
import { MasterAreaModule } from 'master_area_v2/master_area.module';
import { PcmsItrChecklistModule } from 'pcms_itr_checklist/pcms_checklist.module';
import { PortalProjectModule } from 'portal_project/portal_project.module';
import { PublicDisciplineModule } from 'public_list/discipline/public_discipline.module';
import { PublicModulesModule }  from 'public_list/module/public_module.module';
import { PublicTypeModulesModule } from 'public_list/typeOfModule/public_typeModule.module';
import { PublicSystemModule } from 'public_list/system/public_system.module';
import { PublicSubsystemModule } from 'public_list/subsystem/public_subsystem.module';
import { PublicPhaseModule } from 'public_list/phase/public_phase.module';
import { PublicLocationModule } from 'public_list/location/public_location.module';
import { PublicProjectModule } from 'public_list/project/public_project.module';
import { ExportModule } from 'export_excel/export_excel.module';
import { PortalUserPermissionModule } from 'portal_permission/module/portal_permission.module';
import { PublicFormModule } from './public_list/form_cert/public_form.module';
import { NotificationsEmailModule } from 'notifications_email/notifications_email.module';
import { PortalAppPermissionModule } from 'portal_app_permission/portal_app.module';
import { PortalRoleDBModule } from 'portal_role_db/portal_role.module';
import { PortalPermissionsModule } from 'portal_permissions/portal_permissions.module';



@Module({
  imports: [
    SftpModule,
    ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
}),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: 'portal',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_PORTAL_HOST'),
        port: config.get('DB_PORTAL_PORT'),
        username: config.get('DB_PORTAL_USERNAME'),
        password: config.get('DB_PORTAL_PASSWORD'),
        database: config.get('DB_PORTAL_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    

    
    BookingModule,
    UserModule,
    PdfModule,
    
    // PUBLIC DATA
    PublicDisciplineModule,
    PublicModulesModule,
    PublicTypeModulesModule,
    PublicSystemModule,
    PublicSubsystemModule,
    PublicPhaseModule,
    PublicLocationModule,
    PublicProjectModule,
    PublicFormModule,

    
    ExcelModule,
    AuthModule,
    CryptoModule,
    SubsystemModule,
    MasterChecklistModule,
    MasterSystemModule,
    MasterPhaseModule,
    MasterPhase,
    MasterFormModule,
    MasterForm,
    MasterDiscipline,
    PortalProject,
    PortalProjectModule,
    PortalUserPermissionModule,
    MasterSystem, 
    PcmsTemplateModule,
    MasterTypeOfModule,
    MasterDisciplineModule,
    MasterModulee,
    CompanyModule,
    PcmsItrModule,
    MasterLocationModule,
    ImportExcelModule,
    PortalUserModule,
    MasterReportModule,
    MasterAreaModule,
    PcmsItrChecklistModule,
    ExportModule,
    NotificationsEmailModule,
    PortalAppPermissionModule,
    PortalRoleDBModule,
    PortalPermissionsModule,

  ],
})
export class AppModule {} 