import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterArea } from './master_area.entity';

@Injectable()
export class MasterAreaService {
    constructor(
    @InjectRepository(MasterArea)
    private readonly MasterAreaRepo: Repository<MasterArea>,
  ) {}
    

 async dropdown() {
    try {
      const areas = await this.MasterAreaRepo.find({
        where: { status_delete: 1 },
        select: ['id', 'name', 'status_delete'],
        order: { name: 'ASC' },
      });
      return { success: true, data: areas };
    } catch (error) {
      throw new Error('Failed to fetch area dropdown: ' + error.message);
    }
  }

}