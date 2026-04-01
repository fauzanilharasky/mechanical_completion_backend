import { Controller, Get, Post, Param, Body, Put, Delete, Query, Req, BadRequestException } from '@nestjs/common';
import { MasterModule } from './master_module.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { MasterModuleService } from './master_module.services';


@Controller('api/master_module')
@ApiBearerAuth('access-token')
export class MasterModuleController {
    constructor(private readonly masterModuleService: MasterModuleService)  { }


  @Get()
  async findAll(
    @Query() queryDto: ServerSideDTO
  ) {
    
    return await this.masterModuleService.findAll(queryDto);
  }

  @Get("select")
     async select() {
       return this.masterModuleService.selectModule();
     }


  @Get(':id')
  findOne(@Param('id') id: number): Promise<MasterModule> {
  
    return this.masterModuleService.findOne(id);
  }

  @Post('/create')
  async create(@Body() data: Partial<MasterModule>, @Req() req): Promise<MasterModule> {
    return this.masterModuleService.create(data, req.user.userId);
  }
    
  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<MasterModule>): Promise<MasterModule> {
    return this.masterModuleService.update(id, data.mod_desc);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.masterModuleService.remove(id);
  }

  //mendapatakan data seluruh land location secara server side
  @Post('/serverside_list')
  async serverSideList(@Query() queryDto : ServerSideDTO) {
    const data = await this.masterModuleService.serverSideList(queryDto);
    return data;
  }

// @Get('/dropdown')
// async getDropdown(@Param('moduleId') moduleId: string) {
//   const modId = Number(moduleId);

//   if (isNaN(modId)) {
//     throw new BadRequestException('moduleId must be a number');
//   }

//   return this.masterModuleService.dropdown();
// }



}