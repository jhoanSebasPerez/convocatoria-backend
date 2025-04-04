import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    newPassword: string;

    @IsString()
    confirmPassword: string;
}