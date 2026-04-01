import { IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class GenerateExcelDto {
  // pagination (diabaikan saat export)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  size?: number;

  // sorting → contoh: "tag_number,ASC"
  @IsOptional()
  @IsString()
  sort?: string;

  // search global / column (JSON string)
  @IsOptional()
  @IsString()
  search?: string;

  // filter khusus
  @IsOptional()
  @IsString()
  drawing_no?: string;

  @IsOptional()
  @IsString()
  type_of_module?: string;

  @IsOptional()
  @IsString()
  discipline?: string;

   @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsNumber()
  id_project?: string;

  @IsOptional()
  @IsNumber()
  cert_id?: string;
}
