import * as bcrypt from 'bcrypt';
import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import ms, { StringValue } from 'ms';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {

    constructor(
        @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService
    ) { }

    async login(user: User) {

        const expires = this.getExpires();

        const token = await this.generateAccessToken(user);

        const userFromDb = await this.prisma.user.findUnique({
            where: { id: user.id, isActive: true }
        });

        if (!userFromDb) {
            throw new UnauthorizedException("Invalid credentials: User not found");
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                accessToken: token,
                accessTokenExpires: expires
            }
        });

        return { token, expires };
    }

    getExpires() {
        const expires = new Date();
        expires.setMilliseconds(
            expires.getMilliseconds() + ms(this.configService.getOrThrow<string>('JWT_EXPIRATION') as StringValue)
        );
        return expires;
    }


    async verifyAccessToken(token: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                accessToken: token,
                accessTokenExpires: {
                    gte: new Date()
                }
            }
        });

        if (!user) {
            throw new UnauthorizedException("Invalid token");
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                accessToken: null,
                accessTokenExpires: null,
                isActive: true
            }
        });

        return { "success": true, "message": "Token is valid" };
    }

    async validateUser(email: string, password: string) {
        try {
            const user = await this.userService.getUser({ email });
            if (!user) {
                throw new UnauthorizedException("Invalid credentials: User not found");
            }
            const authenticated = await bcrypt.compare(password, user.password);

            if (!authenticated) {
                throw new UnauthorizedException('Invalid credentials');
            }
            return user;
        } catch (error) {
            throw new UnauthorizedException('Invalid credentials');
        }

    }

    async generateAccessToken(user: User) {
        const payloadToken = { userId: user.id }
        return this.jwtService.sign(payloadToken);
    }

    async logout(user: User) {
        console.log("Logging out user", user);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                accessToken: null,
                accessTokenExpires: null
            }
        });
    }
}
