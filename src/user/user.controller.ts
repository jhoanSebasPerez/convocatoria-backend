import { Controller, Post, Body, Get, Put, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/types/valid-roles.type';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Auth(ValidRoles.ADMIN)
  @Post('create-docente')
  async createDocente(@Body() body: { email: string; fullname: string }) {
    return this.userService.createDocente(body.email, body.fullname);
  }

  @Post('activar-cuenta')
  async activarCuenta(@Body() body: { accessToken: string; password: string }) {
    return this.userService.activateDocente(body.accessToken, body.password);
  }

  @Auth(ValidRoles.ADMIN, ValidRoles.DOCENTE, ValidRoles.ESTUDIANTE)
  @Get('me')
  getMe(@GetUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      fullname: user.fullname,
    };
  }

  @Get()
  @Auth(ValidRoles.ADMIN)
  getUsers() {
    return this.userService.getUsers();
  }

  @Get('docentes')
  @Auth(ValidRoles.ADMIN)
  getDocentes() {
    return this.userService.getDocentes();
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN)
  getUser(@GetUser() user: User) {
    return user;
  }

  @Auth(ValidRoles.ADMIN, ValidRoles.DOCENTE, ValidRoles.ESTUDIANTE)
  @Put('update')
  async updateUser(@GetUser() user: User, @Body() userUpdateDto: UpdateUserDto) {
    return this.userService.updateUser(user.id, userUpdateDto);
  }

  @Auth()
  @Put('change-password')
  async changePassword(@GetUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }
    return this.userService.changePassword(user.id, changePasswordDto.newPassword);
  }
}
