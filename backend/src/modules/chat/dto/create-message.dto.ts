import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}

