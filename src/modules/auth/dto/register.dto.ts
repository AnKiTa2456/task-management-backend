import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail, IsString, MinLength, MaxLength, Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Alice Morgan' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and a number',
  })
  password: string;
}
