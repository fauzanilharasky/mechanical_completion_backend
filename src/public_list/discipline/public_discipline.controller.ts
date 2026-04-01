import { Controller, Get, Query } from '@nestjs/common';
import { MasterDisciplineService } from '../../master_discipline/master_discipline.services';
import { Public } from 'public.decorator';

@Controller('public/master_discipline')
@Public()
export class PublicDisciplineController {
  constructor(
    private readonly disciplineService: MasterDisciplineService,
  ) {}


  @Get()
  async disciplineList(@Query() query: any) {
    return this.disciplineService.disciplineList(query);
  }
}
