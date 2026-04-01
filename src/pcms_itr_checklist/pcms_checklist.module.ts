import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PcmsITR } from 'pcms_itr/pcms_itr.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { PcmsItrChecklistService } from './pcms_checklist.services';
import { PcmsItrChecklistController } from './pcms_checklist.controller';
import { MasterChecklist } from 'master_checklist/master_checklist.entity';
import { PcmsItrChecklist } from './pcms_checklist.entity';
import { PortalUser } from 'portal_user_db/portal_user.entity';
import { NotificationsEmailModule } from 'notifications_email/notifications_email.module';

@Module({

  imports: [
    TypeOrmModule.forFeature([
        PcmsItrChecklist,
        PcmsITR,
        MasterChecklist,
      ]),

     NotificationsEmailModule,

    TypeOrmModule.forFeature(
      [PortalUser], 'portal'),

  ],

  providers: [PcmsItrChecklistService, AesEcbService],
  controllers: [PcmsItrChecklistController],
})

export class PcmsItrChecklistModule {}