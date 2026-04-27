"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const alice = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: { email: 'alice@example.com', name: 'Alice Morgan', passwordHash },
    });
    const bob = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: { email: 'bob@example.com', name: 'Bob Chen', passwordHash },
    });
    const team = await prisma.team.upsert({
        where: { slug: 'engineering' },
        update: {},
        create: {
            name: 'Engineering', slug: 'engineering',
            description: 'Core engineering team',
            members: {
                create: [
                    { userId: alice.id, role: client_1.Role.OWNER },
                    { userId: bob.id, role: client_1.Role.MEMBER },
                ],
            },
        },
    });
    const board = await prisma.board.create({
        data: {
            name: 'Sprint 1', ownerId: alice.id, teamId: team.id,
            columns: {
                create: [
                    { name: 'To Do', position: 0 },
                    { name: 'In Progress', position: 1 },
                    { name: 'In Review', position: 2 },
                    { name: 'Done', position: 3 },
                ],
            },
        },
        include: { columns: true },
    });
    const [todo] = board.columns.sort((a, b) => a.position - b.position);
    await prisma.task.createMany({
        data: [
            {
                title: 'Set up project structure', columnId: todo.id,
                creatorId: alice.id, assigneeId: alice.id,
                priority: client_1.Priority.HIGH, status: client_1.TaskStatus.TODO, position: 0,
            },
            {
                title: 'Design database schema', columnId: todo.id,
                creatorId: alice.id, assigneeId: bob.id,
                priority: client_1.Priority.URGENT, status: client_1.TaskStatus.TODO, position: 1,
                dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            },
        ],
    });
    console.log('✅ Seed complete.');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map