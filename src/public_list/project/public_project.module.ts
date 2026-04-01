import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalProjectModule } from 'portal_project/portal_project.module';
import { PublicProjectController } from './public_project.controller';

@Module({
  imports: [
    PortalProjectModule,
  ],
  controllers: [PublicProjectController],
})
export class PublicProjectModule {}
