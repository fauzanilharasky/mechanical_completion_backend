export class CreateUserPermissionDTO {

  id_user: number;

  permissions: number[];
  full_name: string;
  badge_no: string;
  username: string;

  password: any;
  create_by: number;

  create_date: Date;
}