import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/modules/users/entities/user.entity';
import { LoginDto } from './dtos/login.dto';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    const payload = { sub: user.id, email: user.email, role: user.role, organizationId: user.organizationId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  toSafeUser(user: User): SafeUser {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}
