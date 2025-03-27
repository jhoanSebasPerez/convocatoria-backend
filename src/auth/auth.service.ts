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
        const expires = new Date();
        expires.setMilliseconds(
            expires.getMilliseconds() + ms(this.configService.getOrThrow<string>('JWT_EXPIRATION') as StringValue)
        );

        const payloadToken = { userId: user.id }

        const token = this.jwtService.sign(payloadToken);

        const userFromDb = await this.prisma.user.findUnique({
            where: { id: user.id }
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
