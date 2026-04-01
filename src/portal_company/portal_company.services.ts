import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PortalCompany } from './portal_company.entity';

@Injectable()
export class PortalCompanyService {
  constructor(
    @InjectRepository(PortalCompany)
    private repo: Repository<PortalCompany>,
  ) {}

  async findAll(): Promise<PortalCompany[]> {
    return this.repo.find(); 
  }

async selectCompany() {
       const data = await this.repo.find({
        where: { id_company: Not(0) },
        order: { company_name: "ASC" },
        select: ["id_company", "company_name"],
      });
  
      return {
        success: true,
        data,
      };
    }
}