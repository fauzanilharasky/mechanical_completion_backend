import { ApiProperty } from "@nestjs/swagger";
import { IsArray, isArray, IsOptional, IsString } from "class-validator";

export class sendEmailDto {
  @IsString()
  content: string

  @ApiProperty()
  @IsString()
  subject: string

  @ApiProperty()
  @IsArray()
  email_to: string[]

  @IsOptional()
  @IsArray()
  email_cc?: string[]

  @IsOptional()
  @IsArray()
  email_bcc?: string[]

  @IsOptional()
  @IsString()
  from?: string

}
