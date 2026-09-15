import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash: passwordHash,
      phone: '+91' + dto.phone,
    });
    await this.usersRepository.save(user);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  }

  async login(dto: LoginDto) {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!existing) {
      // throw new UnauthorizedException('email not found');
      throw new UnauthorizedException('Invalid credentials');
    }
    const checkPasswordHash = await bcrypt.compare(
      dto.password,
      existing.passwordHash,
    );
    if (!checkPasswordHash) {
      // throw new UnauthorizedException('incorrect password');
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: existing.id,
      email: existing.email,
      role: existing.role,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
