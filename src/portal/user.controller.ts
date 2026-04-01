import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/user')
export class UserController {
  constructor(private readonly _user: UserService) {}

  @Get('/list')
  async GetUserList() {
    return this._user.findAll();
  }
}
