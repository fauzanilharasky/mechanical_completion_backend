import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'public.decorator';
import { MasterLocationService } from 'master_location_v2/master_location.services';

@Controller('public/master_location')
@Public()
export class PublicLocationController {
  constructor(
    private readonly masterLocationService: MasterLocationService,
  ) {}


  @Get()
  async locationList(@Query() query: any) {
    return this.masterLocationService.locationList(query);
  }
}
