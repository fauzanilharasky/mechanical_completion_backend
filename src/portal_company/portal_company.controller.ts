
import { Controller, Get, Post, Param, Body, Put, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PortalCompanyService } from './portal_company.services';
import { PortalCompany } from './portal_company.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';


@Controller('api/portal_company')
@ApiBearerAuth('access-token')
export class CompanyController {
  constructor(
    private readonly projectCompany: PortalCompanyService,
    private readonly aesEcb: AesEcbService
  ) {}

   @Get("select")
   async select() {
     return this.projectCompany.selectCompany();
   }


  @Get()
  async getAll(): Promise<PortalCompany[]> {
    return this.projectCompany.findAll();
  }
}


