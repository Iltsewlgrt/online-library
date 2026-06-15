import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UsersService {
    async create(data: { username: string; password: string }) {
        return prisma.user.create({ data });
    }

    async findByUsername(username: string) {
        return prisma.user.findUnique({ where: { username } });
    }

    async findById(id: string) {
        return prisma.user.findUnique({ where: { id } });
    }
}
