import { ApiProperty } from "@nestjs/swagger";



export class AuthDTO {
  @ApiProperty()
  id_user: string;
}
