import { IsEmail, IsString } from "class-validator";

export class UserLoginDto {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}