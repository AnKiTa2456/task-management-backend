import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private get isProd();
    register(dto: RegisterDto, res: Response): Promise<{
        accessToken: string;
        user: any;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        accessToken: string;
        user: any;
    }>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(user: any, res: Response): Promise<{
        message: string;
    }>;
    getMe(user: any): Promise<any>;
}
