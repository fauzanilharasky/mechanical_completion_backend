import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../portal/user.entity';
import { Repository } from 'typeorm';
import { AuthDTO } from './DTO/auth.dto';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { PortalUserPermissionService } from 'portal_permission/portal_permission.services';
import { PortalUser } from 'portal_user_db/portal_user.entity';
import * as bcrypt from 'bcrypt';



@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User, 'portal') private readonly _user: Repository<User>,

    @InjectRepository(PortalUser, "portal")
    private readonly PortalUserRepo: Repository<PortalUser>,

    private _portalUserPermission: PortalUserPermissionService,
    private readonly aesEcb: AesEcbService,
  ) { }

  async login(authDTO: AuthDTO) {
  try {
    const { id_user } = authDTO;

    if (!id_user || typeof id_user !== "string") {
      throw new BadRequestException("id_user tidak valid");
    }

    let idUserNum: number | null = null;

    // 🔥 TRY DECRYPT
    try {
      const decrypted = this.aesEcb.decryptBase64Url(id_user);
      idUserNum = Number.parseInt(decrypted, 10);
    } catch (err) {
      // fallback jika bukan encrypted
      idUserNum = Number(id_user);
    }

    // 🔥 VALIDASI FINAL
    if (!idUserNum || isNaN(idUserNum)) {
      throw new BadRequestException("id_user tidak valid");
    }

    const login = await this._user.findOne({
      where: {
        id_user: idUserNum,
        status_user: 1,
      },
    });

    // 🔥 PERBAIKAN UTAMA DI SINI
    if (!login) {
      return {
        success: false,
        message: "User tidak ditemukan",
      };
    }

    const userPermissions =
      await this._portalUserPermission.get_user_permissions(
        login.id_user,
        "34"
      );

    const payload = {
      userId: login.id_user,
      username: login.username,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      user: {
        full_name: login.full_name,
        permissions: userPermissions,
      },
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Terjadi kesalahan saat login",
    };
  }
}


  // LOGIN PAGE
  async loginUser(email: string, password: string) {
  const user = await this.PortalUserRepo.findOne({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedException("Email not found");
  }


  const isMatch = await bcrypt.compare(
    password.trim(),
    user.password
  );

  if (!isMatch) {
    throw new UnauthorizedException("Password incorrect");
  }


  const userPermissions =
    await this._portalUserPermission.get_user_permissions(
      user.id_user,
      "34"
    );

  const payload = {
    id_user: user.id_user,
    email: user.email,
  };

  // console.log(userPermissions, "testingssss");
  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id_user: user.id_user,
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      badge_no: user.badge_no,
      permissions: userPermissions,
    },
  };
}

}
