import { Controller, Get, Post, Param, Body, Put, Delete, Query, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { User } from '../portal/user.entity';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { portalPermission } from './portal_permissions.entity';
import { PortalPermissionsService } from './portal_permissions.service';
import { UpdatePortalAppPermissionDto } from 'DTO/dto.update_permissions';



// @UseGuards(PermissionGuard)
@Controller('api/portal_permission')
@ApiBearerAuth('access-token')
export class portalPermissionController {

  constructor(private readonly portalPermissionService: PortalPermissionsService ) { }

 @Post('/permissions')
  async permissionsGroup(@Body() @Query() queryDto: ServerSideDTO) {
    const data = await this.portalPermissionService.permissionsGroup(queryDto);
    // console.log(body, 'bodyyyyy')
    return data;
  }

    @Post('/create')
    async create(@Body() queryDto: ServerSideDTO, @Req() req) {
        return this.portalPermissionService.create(queryDto);
    }

    @Get(':id_permission')
    findOne(@Param('id_permission') id_permission: string): Promise<portalPermission> {
      return this.portalPermissionService.findOne(id_permission);
    }

    // EDIT PERMISSION

     @Put(':id_permission') 
      update( @Param('id_permission') id_permission: string, @Body() updateDto: UpdatePortalAppPermissionDto,
      ): Promise<portalPermission> {
        return this.portalPermissionService.update(id_permission, updateDto);
      }
}