import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'public.decorator';
import { SubsystemService } from '../../master_subsystem/subsystem.service';

@Controller('public/master_subsystem')
@Public()
export class PublicSubsystemController {
  constructor(
    private readonly subsystemService: SubsystemService,
  ) {}


  @Get()
  async subsystemList(@Query() query: any) {
    return this.subsystemService.subsystemList(query);
  }
}
