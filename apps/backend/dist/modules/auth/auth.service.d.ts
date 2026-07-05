import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { LoginDto } from './dtos/login.dto';
export type SafeUser = Omit<User, 'password'>;
export declare class AuthService {
    private readonly usersRepository;
    private readonly jwtService;
    constructor(usersRepository: Repository<User>, jwtService: JwtService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: SafeUser;
    }>;
    toSafeUser(user: User): SafeUser;
}
//# sourceMappingURL=auth.service.d.ts.map