import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    fullname?: string;

    @IsOptional()
    @IsEmail()
    email?: string;
}
