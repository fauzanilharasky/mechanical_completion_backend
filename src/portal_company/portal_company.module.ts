import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalCompany } from './portal_company.entity';
import { PortalCompanyService } from './portal_company.services';
import { CompanyController } from './portal_company.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';

@Module({
  imports: [TypeOrmModule.forFeature([PortalCompany])],
  controllers: [CompanyController], 
  providers: [PortalCompanyService, AesEcbService], 
})
export class CompanyModule {}
