import { SetMetadata } from '@nestjs/common';
import type { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts an endpoint to users with the given roles.
 * Usage: @Roles('ADMIN', 'OWNER')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
