import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'public.decorator';
import { MasterPhaseService } from 'master_phase/master_phase.services';

@Controller('public/master_phase')
@Public()
export class PublicPhaseController {
  constructor(
    private readonly masterPhaseService: MasterPhaseService,
  ) {}


  @Get()
  async phaseList(@Query() query: any) {
    return this.masterPhaseService.phaseList(query);
  }
}
