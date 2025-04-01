import { Body, Controller, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserLoginDto } from './dtos/user-login.dto';
import { CurrentUser } from './current-user.decorator';
import { User } from '@prisma/client';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { ValidRoles } from './types/valid-roles.type';
import { GetUser } from './decorators/get-user.decorator';
@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) { }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(
        @Body() body: UserLoginDto,
        @CurrentUser() user: User,
        @Res({ passthrough: true }) res: Response
    ) {
        const { token, expires } = await this.authService.login(user);
        res.cookie("Authentication", token, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            expires,
        });

        res.status(HttpStatus.OK).json({ success: true });
    }

    @Post('logout')
    @Auth(ValidRoles.ADMIN, ValidRoles.ESTUDIANTE, ValidRoles.DOCENTE)
    async logout(
        @GetUser() user: User,
        @Res({ passthrough: true }) res: Response
    ) {
        await this.authService.logout(user);

        res.clearCookie("Authentication");
        res.status(HttpStatus.OK).json({ success: true });
    }

    @Post('verify-token')
    async verifyToken(
        @Body('accessToken') token: string
    ) {
        return this.authService.verifyAccessToken(token);
    }
}
