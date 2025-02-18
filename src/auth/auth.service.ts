import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { User } from '@prisma/client';
import ms, { StringValue } from 'ms';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService
    ) { }

    async login(user: User, response: Response) {
        const expires = new Date();
        expires.setMilliseconds(
            expires.getMilliseconds() + ms(this.configService.getOrThrow<string>('JWT_EXPIRATION') as StringValue)
        );

        const payloadToken = { userId: user.id }

        const token = this.jwtService.sign(payloadToken);

        response.cookie('Authentication', token, {
            expires,
            httpOnly: true,
            secure: true
        });

        return { payloadToken };
    }

    async validateUser(email: string, password: string) {
        try {
            const user = await this.userService.getUser({ email });
            if (!user) {
                throw new UnauthorizedException("Invalid credentials: User not found");
            }
            await bcrypt.compare(password, user.password);
            return user;
        } catch (error) {
            throw new UnauthorizedException('Invalid credentials');
        }

    }
}
