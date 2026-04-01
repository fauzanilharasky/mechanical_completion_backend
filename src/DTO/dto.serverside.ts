import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ServerSideDTO {
  @IsOptional()
  sort: any;

  @IsOptional()
  search: any;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  size: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take: number;

  @IsOptional()
  drawing_no: any;

  @IsOptional()
  discipline: any;

  @IsOptional()
  type_of_module: any;

  @IsOptional()
  status_inspection: any;

  @IsOptional()
  // @Type(() => Number)
  // @IsNumber()
  form_id: string;

  @IsOptional()
  id_app_permission: string;

  @IsOptional()
  permission_name: string;

  @IsOptional()
  permission_group: string;

  project_name?: string;
}
