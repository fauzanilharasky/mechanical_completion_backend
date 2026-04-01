import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDTO } from './DTO/auth.dto';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { Public } from '../public.decorator';

@Public()
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly _auth: AuthService,
  ) {}

  @Post('validate')
  async validate(@Body() authDTO: AuthDTO) {
    return this._auth.login(authDTO);
  }
  
  @Post('login')
  async loginUser(@Body() body: any) {
    return this._auth.loginUser(body.email, body.password);
  }
 
  
  @Post("login-user")
loginManual(@Body() body: { email: string; password: string }) {
  return this._auth.loginUser(body.email, body.password); 
}
}
