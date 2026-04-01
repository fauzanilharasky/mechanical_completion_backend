import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterSystemModule } from 'master_system/master_system.module';
import { PublicSystemController } from './public_system.controller';
import { PortalProject } from 'portal_project/portal_project.entity';

@Module({
  imports: [MasterSystemModule, 
    TypeOrmModule.forFeature([PortalProject], "portal")

  ],
  controllers: [PublicSystemController],
})
export class PublicSystemModule {}
