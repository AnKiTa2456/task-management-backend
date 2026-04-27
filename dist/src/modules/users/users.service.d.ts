import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    search(query: string): Promise<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        avatarUrl: string | null;
        _count: {
            createdTasks: number;
            assignedTasks: number;
            comments: number;
        };
    }>;
    updateProfile(userId: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        updatedAt: Date;
        email: string;
        avatarUrl: string | null;
        bio: string | null;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
