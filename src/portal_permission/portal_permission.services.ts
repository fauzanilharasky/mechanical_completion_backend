import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
// import { CreatePortalUserPermissionDto } from './dto/create-portal_user_permission.dto';
// import { UpdatePortalUserPermissionDto } from './dto/update-portal_user_permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { portalUserPermission } from './entities/portal_permission.entity';
import { In, Repository } from 'typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { portalPermission } from 'portal_permissions/portal_permissions.entity';
import { CreateUserPermissionDTO } from 'DTO/dto.create_permissions';

@Injectable()
export class PortalUserPermissionService {
  constructor(
    @InjectRepository(portalUserPermission, 'portal')
    private readonly _portalUserPermission: Repository<portalUserPermission>,

    @InjectRepository(portalPermission, 'portal')
    private readonly PortalPermissionsRepo : Repository<portalPermission>,
    private readonly aesEcb: AesEcbService,

  ) { }

  async get_user_permissions(id_user: number, id_portal_app: string) {
    try {
      const userPermission = await this._portalUserPermission.find({
        select: {
          index_key: true
        },
        where: {
          id_user: id_user,
          id_portal_app_permission: id_portal_app
        }
      })

      const permissionArray = userPermission.map(p => p.index_key);

      const permissionString = this.aesEcb.encryptToBase64Url(JSON.stringify(permissionArray));

      return permissionString;
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }


  async saveUserPermission(data: CreateUserPermissionDTO) {

  const { id_user, permissions, create_by, create_date } = data;

  const decUserId = Number(
    this.aesEcb.decryptBase64Url(String(id_user))
  );

  if (!decUserId) {
    throw new BadRequestException("id_user decrypt gagal");
  }

  await this._portalUserPermission.delete({
    id_user: decUserId
  });

  const decCreateBy = Number(
    this.aesEcb.decryptBase64Url(String(create_by))
  );

  const permissionList = await this.PortalPermissionsRepo.find({
    where: { id_permission: In(permissions) }
  });

  const insertData = permissionList.map((perm) => ({
    id_user: decUserId,
    id_portal_app_permission: String(perm.id_app_permission),
    id_portal_permission: String(perm.id_permission),
    index_key: perm.index_key,
    create_by: decCreateBy,
    create_date: create_date ?? new Date()
  }));

  return await this._portalUserPermission.save(insertData);
}



 // GET USER PERMISSION
  async getUserPermission(id_user: number) {

    return await this._portalUserPermission.find({
      where: { id_user }
    });
  }

  // DELETE DATA PERMISSION

  async deleteUserPermission(id_user: number) {

    return await this._portalUserPermission.delete({ id_user });
  }

  // get Permission By User
  async getPermissionByUser(id_user: string) {
    const decId = Number(this.aesEcb.decryptBase64Url(id_user));

    const data = await this._portalUserPermission.find({
    where: { id_user: decId },
  });

  if (!data) {
    throw new NotFoundException('Portal User Permission undefined');
  }
    return data;
}

// SAVE DATA PERMISSION

// async savePermission(data: CreateUserPermissionDTO) {

//   const { id_user, permissions, create_by, create_date } = data;

//   if (!id_user) {
//     throw new Error("id_user is required");
//   }

//   // hapus permission lama
//   await this._portalUserPermission.delete({ id_user });

//   const permissionList = await this.PortalPermissionsRepo.find({
//     where: { id_permission: In(permissions) }
//   });

//   const insert = permissionList.map((perm) => ({
//     id_user: id_user,
//     id_portal_app_permission: perm.id_app_permission,
//     id_portal_permission: perm.id_permission,
//     index_key: perm.index_key,
//     create_by: user.id,
//     create_date: new Date()
//   }));

//   return await this._portalUserPermission.save(insert);
// }


}
