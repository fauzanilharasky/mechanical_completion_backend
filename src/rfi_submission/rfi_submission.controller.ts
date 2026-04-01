import { Controller, Get, Param } from '@nestjs/common';
import { RfiSubmissionService } from './rfi_submission.service';

@Controller('rfi-submission')
export class RfiSubmissionController {
  constructor(private readonly rfiService: RfiSubmissionService) {}

  @Get()
  async getAll() {
    return this.rfiService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.rfiService.findOne(Number(id));
  }
}
