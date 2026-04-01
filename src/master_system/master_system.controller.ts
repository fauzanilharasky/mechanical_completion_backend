import { MasterSystemService } from './master_system.service';
import { Controller, Get, Post, Param, Body, Put, Delete, Query, UseGuards, Req, } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { MasterSystem } from './master_system.entity';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { Permission } from 'portal_permission/decorator/portal_permission.decorator';
import { Public } from 'public.decorator';

@UseGuards(PermissionGuard)
@Controller('api/master_system')
@ApiBearerAuth('access-token')
export class MasterSystemController {
  constructor(private readonly masterSystemService: MasterSystemService) { }



  @Public()
  @Get('dropdown')
  async getDropdown() {
    return await this.masterSystemService.getSystemDropdown();
  }




  @Permission([1])
  @Get()
  async findAll(
    @Query() queryDto: ServerSideDTO
  ) {
    return await this.masterSystemService.findAll(queryDto);
  }

  @Permission([5])
  @Get(':id')
  findOne(@Param('id') id: string): Promise<MasterSystem> {
    return this.masterSystemService.findOne(id);
  }


  // @Permission([4])
  @Post('/create')
  create(@Body() data: any, @Req() req): Promise<MasterSystem> {
     const userId = req.user?.userId;
    return this.masterSystemService.create(data, userId);    
    
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<MasterSystem>): Promise<MasterSystem> {
    return this.masterSystemService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.masterSystemService.remove(id);
  }
}