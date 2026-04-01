import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalProject } from './portal_project.entity';
import { PortalProjectService } from './portal_project.service';
import { ProjectController } from './portal_project.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';

@Module({
  imports: [TypeOrmModule.forFeature([PortalProject], 'portal')],
  controllers: [ProjectController], 
  providers: [PortalProjectService, AesEcbService], 
  exports: [PortalProjectService],
})
export class PortalProjectModule {}
