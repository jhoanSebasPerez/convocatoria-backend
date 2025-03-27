import { applyDecorators, UseGuards } from "@nestjs/common";
import { RoleProtected } from "./role-protected.decorator";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { ValidRoles } from "../types/valid-roles.type";
import { UserRoleGuard } from "../guards/user-role.guard";

export function Auth(...roles: ValidRoles[]) {
    if (roles.length > 0) {
        return applyDecorators(
            RoleProtected(...roles),
            UseGuards(JwtAuthGuard, UserRoleGuard)
        );
    }

    return applyDecorators(
        UseGuards(JwtAuthGuard)
    );
}