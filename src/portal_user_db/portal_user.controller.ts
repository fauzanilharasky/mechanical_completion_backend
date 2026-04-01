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
} from "@nestjs/common";
import { PortalUser } from "./portal_user.entity";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ServerSideDTO } from "DTO/dto.serverside";
import { PortalUserService } from './portal_user.service';
import * as bcrypt from 'bcrypt';
import { UpdateUserDTO } from "DTO/dto.update_profile";
import { CreateUserPermissionDTO } from "DTO/dto.create_permissions";

@Controller("api/portal_user")
@ApiBearerAuth("access-token")
export class PortalUserController {
  aesEcb: any;
  constructor(private readonly portalUserService: PortalUserService) {}
  @Get("/dropdown-assign")
  async getDropdownUsers() {
    const data = await this.portalUserService.getDropdownUsers();
    return { data };
  }

  @Get("user_system")
  async getListUser(@Query() queryDto: ServerSideDTO) {
    return await this.portalUserService.getListUser(queryDto);
  }

  @Get(":id_user")
  getEditData(@Param("id_user") id_user: string): Promise<PortalUser> {
    return this.portalUserService.getEditData(id_user);
  }




  @Get()
  async findAll(@Query() queryDto: ServerSideDTO) {
    return await this.portalUserService.findAll(queryDto);
  }

  // GET DATA PROFILE
 @Get(':id')
async getUserById(@Param('id') id: string): Promise<PortalUser> {
  let decryptedId: number;

  try {
    
    decryptedId = Number(this.aesEcb.decryptBase64Url(id));
  } catch (err) {
    // 🔥 fallback ke plain number
    decryptedId = Number(id);
  }

  if (!decryptedId) {
    throw new BadRequestException('Invalid user id');
  }

  return this.portalUserService.findById(decryptedId);
}



  @Get(":id")
  findOne(@Param("id") id: number): Promise<PortalUser> {
    return this.portalUserService.findOne(id);
  }


  @Post("/create")
  async create(
    @Body() data: Partial<PortalUser>,
    @Req() req
  ): Promise<PortalUser> {
    return this.portalUserService.create(data, req.user.userId);
  }

  // CREATE DATA USER MANAGEMENT
   @Post('/create_account')
    async createUser(@Body() data: CreateUserPermissionDTO) {
    return this.portalUserService.createUser(data);
  }

  // REGISTER ACCCOUNT DATA
   @Post('/register')
    async registerAccount(@Body() data: Partial<PortalUser>) {
    return this.portalUserService.registerAccount(data);
  }

  // ACCOUNT PROFILE INDIVIDU
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDTO,
  ) {
    let userId: number;

    try {
      userId = Number(this.aesEcb.decryptBase64Url(id));
    } catch (err) {
      userId = Number(id);
    }

    if (!userId) {
      throw new BadRequestException('Invalid user id');
    }

    return this.portalUserService.updateUser(userId, body);
  }


  @Put('account/:id_user')
    updateAccount(@Param('id_user') id_user: string, @Body() data: UpdateUserDTO,  @Req() req,) {
      return this.portalUserService.updateAccount(id_user, data, req.user.userId);
    }

  @Put(":id")
  update(
    @Param("id") id_itr: number,
    @Body() data: Partial<PortalUser>, 
  ): Promise<PortalUser> {
    return this.portalUserService.update(id_itr, data);
  }


  @Delete(":id")
  remove(@Param("id") id: number): Promise<void> {
    return this.portalUserService.remove(id);
  }

  @Post("/serverside_list")
  async serverSideList(@Query() queryDto: ServerSideDTO) {
    return await this.portalUserService.serverSideList(queryDto);
  }

}
