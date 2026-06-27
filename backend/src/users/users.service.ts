import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

/** Fields returned for any public/authenticated user profile — never exposes the password hash. */
const SAFE_USER_SELECT = { id: true, username: true, createdAt: true } as const;

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: { username: string; password: string }) {
        return this.prisma.user.create({ data });
    }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({ where: { username } });
    }

    /** Returns the full record including password — for internal auth use only. */
    async findById(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    /** Returns a safe profile object without the password hash. */
    async getProfile(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: SAFE_USER_SELECT,
        });
    }

    async updateUsername(userId: string, username: string) {
        const existing = await this.findByUsername(username);
        if (existing && existing.id !== userId) {
            throw new BadRequestException('Username already taken');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { username },
            select: SAFE_USER_SELECT,
        });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const matches = await bcrypt.compare(currentPassword, user.password);
        if (!matches) {
            throw new BadRequestException('Current password is invalid');
        }

        const password = await bcrypt.hash(newPassword, 10);
        return this.prisma.user.update({
            where: { id: userId },
            data: { password },
            select: SAFE_USER_SELECT,
        });
    }
}
