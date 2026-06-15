import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private users: UsersService, private jwt: JwtService) { }

    async register(username: string, password: string) {
        const exists = await this.users.findByUsername(username);
        if (exists) throw new BadRequestException('Username already taken');
        const hash = await bcrypt.hash(password, 10);
        const user = await this.users.create({ username, password: hash });
        const token = this.jwt.sign({ sub: user.id, username: user.username });
        return { user: { id: user.id, username: user.username }, token };
    }

    async login(username: string, password: string) {
        const user = await this.users.findByUsername(username);
        if (!user) throw new BadRequestException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new BadRequestException('Invalid credentials');
        const token = this.jwt.sign({ sub: user.id, username: user.username });
        return { user: { id: user.id, username: user.username }, token };
    }
}
