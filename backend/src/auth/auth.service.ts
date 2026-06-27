import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) { }

    async register(username: string, password: string) {
        const exists = await this.users.findByUsername(username);
        if (exists) {
            throw new BadRequestException('Username already taken');
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await this.users.create({ username, password: hash });
        return this.buildAuthResponse(user.id, user.username);
    }

    async login(username: string, password: string) {
        const user = await this.users.findByUsername(username);
        if (!user) {
            throw new BadRequestException('Invalid credentials');
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            throw new BadRequestException('Invalid credentials');
        }

        return this.buildAuthResponse(user.id, user.username);
    }

    async me(userId: string) {
        const user = await this.users.findById(userId);
        if (!user) {
            throw new UnauthorizedException();
        }

        return { id: user.id, username: user.username, createdAt: user.createdAt };
    }

    private buildAuthResponse(userId: string, username: string) {
        const token = this.jwt.sign({ sub: userId, username });
        return { user: { id: userId, username }, token };
    }
}
