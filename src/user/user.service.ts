import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationService } from 'src/notificaciones/notificaciones.service';
import { AuthService } from 'src/auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import ms, { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificacionesService: NotificationService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) { }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const newUser = await this.prismaService.user.create({
        data: {
          ...createUserDto,
          isActive: false,
          roles: ['ESTUDIANTE'],
          password: await bcrypt.hash(createUserDto.password, 10),
        }
      });

      // 🔹 Generar token de acceso y expiración
      const token = await this.authService.generateAccessToken(newUser);

      // 🔹 Actualizar el usuario con el token y la fecha de expiración
      const expires = new Date();
      expires.setMilliseconds(
        expires.getMilliseconds() + ms(this.configService.getOrThrow<string>('JWT_EXPIRATION') as StringValue)
      );

      await this.prismaService.user.update({
        where: { id: newUser.id },
        data: {
          accessToken: token,
          accessTokenExpires: expires // 1 hora
        }
      });

      //enviar email de activación
      this.notificacionesService.enviarEmailCreacionEstudiante(newUser, token);

      return { "success": true, message: 'Usuario creado exitosamente' };

    } catch (error) {
      console.error("🔥 Prisma error:", error); // 👀 Log para debug

      // Manejar errores de violación de restricciones únicas (P2002)
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new BadRequestException('Email already exists');
      }

      // Manejar otros errores inesperados
      throw new BadRequestException('Error creating user');
    }

  }

  async getUser(filter: Prisma.UserWhereUniqueInput) {
    return this.prismaService.user.findUnique({ where: filter });
  }

  async getUsers() {
    return this.prismaService.user.findMany({
      select: {
        id: true,
        email: true,
        fullname: true,
        roles: true,
      },
    });
  }

  async getDocentes() {
    return this.prismaService.user.findMany({
      where: {
        roles: {
          has: 'DOCENTE',
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        roles: true,
      },
    });
  }

  async createDocente(email: string, fullname: string) {
    // 🔹 Verificar si el usuario ya existe

    const existingUser = await this.prismaService.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('El usuario ya existe.');
    }

    // 🔹 Crear el usuario en la base de datos
    const newUser = await this.prismaService.user.create({
      data: {
        email,
        fullname,
        roles: ['DOCENTE'],
        isActive: false,
      },
    });

    const expires = this.authService.getExpires();
    const token = await this.authService.generateAccessToken(newUser);

    await this.prismaService.user.update({
      where: { id: newUser.id },
      data: {
        accessToken: token,
        accessTokenExpires: expires,
      },
    });

    //send email notification to docente
    this.notificacionesService.enviarEmailCreacionDocente(token, newUser);

    return { success: true, mensaje: 'Docente creado exitosamente' };
  }

  async activateDocente(activationToken: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        accessToken: activationToken
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido.');
    }

    if (user.accessToken && user.accessTokenExpires && new Date() > user.accessTokenExpires) {
      throw new BadRequestException('El token ha expirado. Solicita un nuevo enlace de activación.');
    }

    // 🔹 Actualizar usuario y activar cuenta
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        password: await bcrypt.hash(password, 10),
        accessToken: null,
        accessTokenExpires: null,
      },
    });

    return { message: 'Cuenta activada con éxito.' };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prismaService.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: { id: true, email: true, fullname: true, roles: true }
    });
  }

  async changePassword(userId: string, newPassword: string) {
    const user = await this.prismaService.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

}
