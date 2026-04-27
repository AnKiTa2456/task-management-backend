import {
  Injectable, NotFoundException,
  UnauthorizedException, ConflictException,
} from '@nestjs/common';
import * as bcrypt       from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // GET /users/search?q=alice
  async search(query: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { name:  { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: { id: true, name: true, email: true, avatarUrl: true },
      take: 10,
    });
  }

  // GET /users/:id
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        createdAt: true,
        _count: {
          select: { assignedTasks: true, createdTasks: true, comments: true },
        },
      },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  // PATCH /users/profile
  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data:  dto,
      select: { id: true, name: true, email: true, avatarUrl: true, bio: true, updatedAt: true },
    });
  }

  // PATCH /users/password
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { message: 'Password changed successfully' };
  }
}
