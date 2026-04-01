import { Controller, Get, Post, Param, Body, Put, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { SubsystemService } from './subsystem.service';
import { Subsystem } from './subsystem.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { Permission } from 'portal_permission/decorator/portal_permission.decorator';

@UseGuards(PermissionGuard)
@Controller('api/master_subsystem')
@ApiBearerAuth('access-token')
export class SubsystemController {
  constructor(private readonly subsystemService: SubsystemService) { }


  @Get()
  async findAll(@Query() queryDto: ServerSideDTO) {
    return this.subsystemService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Subsystem> {
    return this.subsystemService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @Req() req): Promise<Subsystem> {
    const userId = req.user?.userId;
    return this.subsystemService.create(data, userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req): Promise<Subsystem> {
    const userId = req.user?.userId;
    return this.subsystemService.update(id, data, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.subsystemService.remove(id);
    return { success: true, message: 'Successfully Delete Data' };
  }

  @Permission([2])
  @Post('/serverside')
  async serverSideList(@Body() queryDto: ServerSideDTO) {
    return this.subsystemService.findAll(queryDto);
  }
}
