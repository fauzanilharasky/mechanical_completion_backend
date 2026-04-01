import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'public.decorator';
import { MasterSystemService } from '../../master_system/master_system.service';

@Controller('public/master_system')
@Public()
export class PublicSystemController {
  constructor(
    private readonly masterSystemService: MasterSystemService,
  ) {}


  @Get()
  async systemList(@Query() query: any) {
    return this.masterSystemService.systemList(query);
  }
}
