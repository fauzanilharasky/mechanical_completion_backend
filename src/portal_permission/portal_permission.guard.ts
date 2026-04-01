import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './decorator/portal_permission.decorator';
import { PortalUserPermissionContext } from './portal_permission.context';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private _permissionContext: PortalUserPermissionContext,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Ambil permission yang diminta oleh endpoint
        const requiredPermissions = this.reflector.getAllAndOverride<number[]>(
            PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Kalau endpoint tidak pakai @Permission → bebas akses
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

         // Ambil user dari JWT
        const request = context.switchToHttp().getRequest();
        const user = request.user; // dari JWT AuthGuard
        
        // Ambil permission user dari DB
        const permissionContext = await this._permissionContext.resolve(user.userId);

        // Cek apakah user punya minimal 1 permission yg diminta
        const allowed = permissionContext.hasAny(requiredPermissions);

        if (!allowed) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}