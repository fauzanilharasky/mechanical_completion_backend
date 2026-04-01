import { Injectable } from '@nestjs/common';
import { PortalUserPermissionService } from './portal_permission.services';
import { AesEcbService } from 'crypto/aes-ecb.service';

@Injectable()
export class PortalUserPermissionContext {
    constructor(
        private readonly _userPermissionService: PortalUserPermissionService,
        private readonly aesEcb: AesEcbService,
    ) { }

    async resolve(userId: number, portalAppId: string = '34') {
        const permissions = await this._userPermissionService.get_user_permissions(
            userId,
            portalAppId
        );

        const decrypt_permissions = this.aesEcb.decryptBase64Url(permissions);
        const permissionArray = JSON.parse(decrypt_permissions);

        const permissionSet = new Set(permissionArray);

        return {
            userId,
            permissions,
            hasAny: (required: number[]) => required.some(p => permissionSet.has(String(p))),
            hasAll: (required: number[]) => required.every(p => permissionSet.has(String(p))),
        };
    }

    
}