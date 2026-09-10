import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^[6-9]\d{9}$/, {
    message: 'phone must be a valid 10-digit Indian number',
  })
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;
}
