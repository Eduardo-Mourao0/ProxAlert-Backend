import { Plan, User } from "../../domain/entities/User";
import { UserRepository } from "../../domain/repositories/user-repository";
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma/prisma.service'

@Injectable()
export class PrismaUserRepository implements UserRepository {
    constructor(private prisma: PrismaService) {}

    async create(user: User): Promise<User> { // Cria o usuário no banco de dados usando o Prisma
        const createdUser = await this.prisma.user.create({
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                refreshTokenHash: user.refreshTokenHash,
                plan: user.plan,
                createdAt: user.createdAt,
            },
        });
        return this.toDomain(createdUser);
    }

    async findByEmail(email: string): Promise<User | null> { // Busca um usuário pelo email usando o Prisma
        const user = await this.prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return null
        }

        return this.toDomain(user)
    }

    async findById(id: string): Promise<User | null> { // Busca um usuário pelo id usando o Prisma
        const user = await this.prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            return null
        }

        return this.toDomain(user)
    }

    async update(user: User): Promise<User> { // Atualiza o usuário no banco de dados usando o Prisma
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                name: user.name,
                email: user.email,
                password: user.password,
                refreshTokenHash: user.refreshTokenHash,
                plan: user.plan,
            },
        })

        return this.toDomain(updatedUser)
    }

    async updateRefreshToken(userId: string, refreshTokenHash: string | null): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash },
        })
    }

    async findAll(): Promise<User[]> { // Busca todos os usuários usando o Prisma
        const users = await this.prisma.user.findMany()

        return users.map((user) => this.toDomain(user))
    }

    async delete(id: string): Promise<void> { // Deleta o usuário do banco de dados usando o Prisma
        await this.prisma.user.delete({
            where: { id },
        })
    }

    private toDomain(user: {
        id: string
        name: string
        email: string
        password: string
        refreshTokenHash: string | null
        plan: string
        createdAt: Date
    }): User {
        return User.createFromPrimitives({
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            refreshTokenHash: user.refreshTokenHash,
            plan: user.plan as Plan,
            createdAt: user.createdAt,
        })
    }
}
