import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permissions';

export const Permission = (permissions: number[]) => SetMetadata(PERMISSION_KEY, permissions);