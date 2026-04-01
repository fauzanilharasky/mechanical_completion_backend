import { Controller, Get, Post, Param, Body, Put, Delete, Query, Req } from '@nestjs/common';
import { MasterChecklistService } from '../master_checklist/master_checklist.services';
import { MasterChecklist } from '../master_checklist/master_checklist.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ServerSideDTO } from 'DTO/dto.serverside';


@Controller('api/master_checklist')
@ApiBearerAuth('access-token')
export class MasterChecklistController {
  constructor(private readonly masterChecklistService: MasterChecklistService) { }

  // findAll(): Promise<MasterForm[]> {
  //   return this.masterFormService.findAll();
  // }

  @Get()
  async findAll(
    @Query() queryDto: ServerSideDTO
  ) {
    return await this.masterChecklistService.findAll(queryDto);
  }


  @Get(':id')
  findOne(@Param('id') id: string): Promise<MasterChecklist> {
    return this.masterChecklistService.findOne(id);
  }

  @Post('/create')
  async create(@Body() data: Partial<MasterChecklist>, @Req() req): Promise<MasterChecklist> {
    return this.masterChecklistService.create(data, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<MasterChecklist>): Promise<MasterChecklist> {
    return this.masterChecklistService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.masterChecklistService.remove(id);
  }

  //mendapatakan data seluruh land location secara server side
  @Post('/serverside_list')
  async serverSideList(@Query('form_id') form_id: string, @Query() queryDto : ServerSideDTO) {
    return this.masterChecklistService.serverSideList(queryDto);
  }  
}
