import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: import("./auth.service").SafeUser;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map