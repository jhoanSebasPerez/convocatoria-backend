import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserLoginDto } from './dtos/user-login.dto';
import { CurrentUser } from './current-user.decorator';
import { User } from '@prisma/client';
import { Response } from 'express';
import { AuthService } from './auth.service';

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
        return this.authService.login(user, res);
    }
}
