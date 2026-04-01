import { IsNotEmpty } from "class-validator";

export class ConfirmImportDto {
  @IsNotEmpty()
  sessionId: string;

  @IsNotEmpty()
  userId: number;
}
