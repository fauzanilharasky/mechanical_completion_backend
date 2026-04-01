import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  Query,
  Req,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Request,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ServerSideDTO } from "DTO/dto.serverside";
import { In } from "typeorm";
import { PortalAppPermissionService } from './portal_app.services';
import { portalAppPermission } from './portal_app.entity';
import { UpdatePortalAppPermissionDto } from "DTO/dto.update_permissions";

@Controller("api/portal_app_permission")
@ApiBearerAuth("access-token")
export class PortalAppPermissionController {
    constructor(private readonly portalAppPermissionService: PortalAppPermissionService) {}

    @Get('permissions')
    async findAll(
      @Query() queryDto: ServerSideDTO
    ) {
      return await this.portalAppPermissionService.findAll(queryDto);
    }
    @Get() async getAll() {
      return this.portalAppPermissionService.getAll();
  }


   @Get(':id_application')
    findOne(@Param('id_application') id_application: string): Promise<portalAppPermission> {
      return this.portalAppPermissionService.findOne(id_application);
      
    }


   @Post('/create_permissions')
    async createPermissions(@Body() data: Partial<portalAppPermission>) {
    // req.user.userId harus numerik
    return this.portalAppPermissionService.createPermissions(data);
    }

    @Put(':id_application') 
    update( @Param('id_application') id_application: string, @Body() updateDto: UpdatePortalAppPermissionDto,
    ): Promise<portalAppPermission> {
      return this.portalAppPermissionService.update(id_application, updateDto);
    }
}