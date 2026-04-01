import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterLocationModule } from 'master_location_v2/master_location.module';
import { PublicLocationController } from './public_location.controller';
import { MasterArea } from 'master_area_v2/master_area.entity';


@Module({
  imports: [
    MasterLocationModule,
    MasterArea,
  ],
  controllers: [PublicLocationController],
})
export class PublicLocationModule {}
