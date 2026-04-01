import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { MasterArea } from './master_area.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MasterAreaService } from './master_area.services';

@Controller('api/master_area')
@ApiBearerAuth('access-token')
export class MasterAreaController {
  constructor(private readonly masterAreaService: MasterAreaService) {}



//   @Put(':id')
//   update(
//     @Param('id') id: number,
//     @Body(),
//   ): Promise<MasterArea> {
//     return this.MasterAreaService.update(id, discipline_name);
//   }



  @Get('/dropdown')
  async getDropdown() {
    return this.masterAreaService.dropdown();
  }
}
