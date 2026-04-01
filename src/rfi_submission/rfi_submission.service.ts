import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McTemplate } from './rfi_submission.entity';

@Injectable()
export class RfiSubmissionService {
  constructor(
    @InjectRepository(McTemplate)
    private readonly mcTemplateRepo: Repository<McTemplate>,
  ) {}

  async findAll() {
    return this.mcTemplateRepo.find({
      select: [
        'id',
        'project_id',
        'tag_number',
        'tag_description',
        'module',
        'type_of_module',
        'drawing_no',
        'subsystem_description',
        'location',
        'model_no',
        'serial_no',
        'rating',
        'status_delete',
        'manufacturer',
        'company_id',
      ],
    });
  }

  async findOne(id: number) {
    return this.mcTemplateRepo.findOne({ where: { id } });
  }
}
