import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body 
} from '@nestjs/common';
import { MasterLocationService } from './master_location.services';
import { MasterLocation } from './master_location.entity';

@Controller('api/master_location')
export class MasterLocationController {
  constructor(
    private readonly masterLocationService: MasterLocationService,
  ) {}

  @Get("select")
   async select() {
     return this.masterLocationService.selectLocations();
   }



  @Get('/dropdown/:areaId')
  async getDropdown(@Param('areaId') areaId: number) {
    return this.masterLocationService.dropdown(Number(areaId));
  }

  // Get('dropdown/:Id_Area')
  // async getDropdownByArea(@Param('areaId', ParseIntPipe) areaId: number) {
  //   return this.masterLocationService.dropdownByArea(areaId);
  // }
}
