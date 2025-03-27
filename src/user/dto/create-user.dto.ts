import { IsArray, IsEmail, IsString, IsStrongPassword } from "class-validator";

export class CreateUserDto {
    @IsString()
    fullname: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsArray()
    @IsString({ each: true })
    roles?: string[];

    @IsString()
    @IsStrongPassword()
    password: string;
}
