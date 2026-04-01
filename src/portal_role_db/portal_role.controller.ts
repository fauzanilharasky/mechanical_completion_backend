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
import { portalRoleDB } from './portal_role.entity';
import { PortalRoleDBService } from "./portal_role.service";

@Controller("api/portal_role_db")
@ApiBearerAuth("access-token")
export class PortalRoleDBController {
    constructor(private readonly portalRoleDBService: PortalRoleDBService){}


     @Get()
      async findAll(
        @Query() queryDto: ServerSideDTO
      ) {
        return await this.portalRoleDBService.findAll(queryDto);
      }
}