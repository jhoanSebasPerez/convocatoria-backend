import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {

  constructor(
    private readonly prismaService: PrismaService,
  ) { }

  async createUser(createUserDto: CreateUserDto) {
    try {
      return await this.prismaService.user.create({
        data: {
          ...createUserDto,
          password: await bcrypt.hash(createUserDto.password, 10),
        },
        select: {
          id: true,
          email: true,
          fullname: true,
        },
      });
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

}
