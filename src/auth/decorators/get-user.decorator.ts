import { createParamDecorator, InternalServerErrorException } from "@nestjs/common";

export const GetUser = createParamDecorator((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user)
        throw new InternalServerErrorException("User not found (request)");

    return user;
})