import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUsernameDto } from '../auth/dto/update-username.dto';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @ApiOperation({ summary: 'Get own profile' })
    @Get('me')
    me(@Req() req: Request) {
        return this.usersService.getProfile(req.user!.sub);
    }

    @ApiOperation({ summary: 'Update own username' })
    @Patch('me/username')
    updateUsername(@Req() req: Request, @Body() dto: UpdateUsernameDto) {
        return this.usersService.updateUsername(req.user!.sub, dto.username);
    }

    @ApiOperation({ summary: 'Change own password' })
    @Patch('me/password')
    changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user!.sub, dto.currentPassword, dto.newPassword);
    }
}
