import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

class AuthDto {
    username: string;
    password: string;
}

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('register')
    register(@Body() dto: AuthDto) {
        return this.auth.register(dto.username, dto.password);
    }

    @Post('login')
    login(@Body() dto: AuthDto) {
        return this.auth.login(dto.username, dto.password);
    }
}
