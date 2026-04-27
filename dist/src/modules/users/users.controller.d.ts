import { UsersService } from './users.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    search(q: string): Promise<{
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
    updateProfile(user: any, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        updatedAt: Date;
        email: string;
        avatarUrl: string | null;
        bio: string | null;
    }>;
    changePassword(user: any, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
