import { IsOptional, IsString } from "class-validator";


export class UpdatePortalAppPermissionDto {
   @IsOptional()
   @IsString()
   app_name?: string;

  @IsOptional()
   @IsString()
   permission_name?: string;

   @IsOptional()
   @IsString()
   index_key?: string;

   @IsOptional()
   @IsString()
   permission_group?: string;


}
