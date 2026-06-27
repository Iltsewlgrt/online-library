import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @ApiOperation({ summary: 'Register a new user' })
    @Post('register')
    register(@Body() dto: AuthDto) {
        return this.auth.register(dto.username, dto.password);
    }

    @ApiOperation({ summary: 'Login with username and password' })
    @Post('login')
    login(@Body() dto: AuthDto) {
        return this.auth.login(dto.username, dto.password);
    }

    @ApiOperation({ summary: 'Get current authenticated user' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: any) {
        return this.auth.me(req.user.sub);
    }
}
