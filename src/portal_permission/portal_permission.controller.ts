import { Controller, Post, Body, Get, Param, Delete } from "@nestjs/common";
import { PortalUserPermissionService } from "./portal_permission.services";
import { CreateUserPermissionDTO } from "DTO/dto.create_permissions";
import { portalPermission } from "portal_permissions/portal_permissions.entity";
import { portalUserPermission } from "./entities/portal_permission.entity";

@Controller("api/portal_user_permission")
export class PortalUserPermissionController {

  constructor(
    private readonly service: PortalUserPermissionService
  ) {}

  @Post("/save")
  async createPermission(
    @Body() data: CreateUserPermissionDTO
  ) {
    return this.service.saveUserPermission(data);
  }

  @Get(":id_user")
  async getPermission(
    @Param("id_user") id_user: number
  ) {
    return this.service.getUserPermission(id_user);
  }

  @Delete(":id_user")
  async deletePermission(
    @Param("id_user") id_user: number
  ) {
    return this.service.deleteUserPermission(id_user);
  }


  // SAVE DATA PERMISSION
  //  @Post('save')
  // async savePermission(
  //   @Body() data: CreateUserPermissionDTO,
  // ) {
  //   return await this.service.savePermission(data);
  // }



  // GET DATA UNTUK LIST PERMISSION
  @Get("user/:id_user")
async getPermissionByUser(@Param("id_user") id_user: string) {
  return this.service.getPermissionByUser(id_user);
}


}