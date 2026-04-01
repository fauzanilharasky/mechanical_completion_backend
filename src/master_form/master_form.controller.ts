import { Controller, Get, Post, Param, Body, Put, Delete, Query, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { MasterFormService } from '../master_form/master_form.services';
import { MasterForm } from '../master_form/master_form.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { User } from '../portal/user.entity';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { Permission } from 'portal_permission/decorator/portal_permission.decorator';



@UseGuards(PermissionGuard)
@Controller('api/master_form')
@ApiBearerAuth('access-token')
export class MasterFormController {

  constructor(private readonly masterFormService: MasterFormService) { }



  @Get()
  async findAll(
    @Query() queryDto: ServerSideDTO
  ) {
    return await this.masterFormService.findAll(queryDto);
  }


  @Get(':id')
  findOne(@Param('id') id: string): Promise<MasterForm> {
    return this.masterFormService.findOne(id);
    
  }

 @Post('/create')
async create(@Body() data: Partial<MasterForm>) {
  // req.user.userId harus numerik
  return this.masterFormService.create(data);
}



  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<MasterForm>): Promise<MasterForm> {
    return this.masterFormService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.masterFormService.remove(id);
  }

  @Permission([3])
  @Post('/serverside_list')
  async serverSideList(@Query() queryDto: ServerSideDTO) {
    const data = await this.masterFormService.serverSideList(queryDto);
    return data;
  }
}
