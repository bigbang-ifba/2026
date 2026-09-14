import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ParticipanteService from './participanteService.js';
import { PrismaClient } from '@prisma/client';
import type {DeepMockProxy} from 'vitest-mock-extended';

// 1. Mock do Prisma
vi.mock('../../prismaClient', async () => {
    const actual = await vi.importActual<typeof import('vitest-mock-extended')>('vitest-mock-extended');
    return {
        __esModule: true,
        default: actual.mockDeep<PrismaClient>(),
    };
});

// 2. Import do mock após a definição
import prisma from '../../prismaClient.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Participante Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- LISTAR PARTICIPANTES ---
    describe('listarParticipantes', () => {
        it('Sucesso: Deve retornar lista paginada e totais corretos', async () => {
            // ARRANGE
            const mockParticipantes = [
                { codRanking: 1, usuario: 'User1', pontuacao: 100, nivel: 'INICIANTE' },
                { codRanking: 2, usuario: 'User2', pontuacao: 90, nivel: 'INICIANTE' }
            ];
            const mockTotal = 20;

            // O $transaction retorna um array: [resultado do count, resultado do findMany]
            prismaMock.$transaction.mockResolvedValue([mockTotal, mockParticipantes] as any);

            // ACT
            const resultado = await ParticipanteService.listarParticipantes(1, 10);

            // ASSERT
            // Verifica se chamou a transação
            expect(prismaMock.$transaction).toHaveBeenCalled();

            // Verifica se os argumentos do findMany estavam certos (skip: 0 para pág 1)
            expect(prismaMock.ranking.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { pontuacao: 'desc' },
                skip: 0,
                take: 10
            });

            // Verifica o cálculo do retorno
            expect(resultado.data).toEqual(mockParticipantes);
            expect(resultado.total).toBe(20);
            expect(resultado.pagina).toBe(1);
            expect(resultado.totalPaginas).toBe(2); // 20 itens / 10 por pag = 2 páginas
        });

        it('Sucesso: Deve calcular o skip corretamente para a página 2', async () => {
            prismaMock.$transaction.mockResolvedValue([0, []] as any);

            await ParticipanteService.listarParticipantes(2, 5);

            expect(prismaMock.ranking.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 5, // (2 - 1) * 5 = 5
                take: 5
            }));
        });

        it('Erro: Deve lançar exceção se o banco falhar', async () => {
            prismaMock.$transaction.mockRejectedValue(new Error('Erro de Conexão'));

            await expect(ParticipanteService.listarParticipantes(1, 10))
                .rejects.toThrow('Erro de Conexão');
        });
    });

    // --- DELETAR PARTICIPANTE ---
    describe('deletarParticipante', () => {
        it('Sucesso: Deve deletar participante pelo ID', async () => {
            // ARRANGE
            const mockDeletado = { codRanking: 1, usuario: 'Deletado' };
            prismaMock.ranking.delete.mockResolvedValue(mockDeletado as any);

            // ACT
            await ParticipanteService.deletarParticipante(1);

            // ASSERT
            expect(prismaMock.ranking.delete).toHaveBeenCalledWith({
                where: { codRanking: 1 }
            });
        });

        it('Erro: Deve lançar erro se o participante não existir', async () => {
            // O Prisma lança erro específico quando não acha o registro no delete
            prismaMock.ranking.delete.mockRejectedValue(new Error('Record to delete does not exist.'));

            await expect(ParticipanteService.deletarParticipante(999))
                .rejects.toThrow('Record to delete does not exist');
        });
    });

    // --- ATUALIZAR PARTICIPANTE ---
    describe('atualizarParticipante', () => {
        it('Sucesso: Deve atualizar o nome do usuário', async () => {
            // ARRANGE
            const mockAtualizado = { codRanking: 10, usuario: 'Novo Nome' };
            prismaMock.ranking.update.mockResolvedValue(mockAtualizado as any);

            // ACT
            const resultado = await ParticipanteService.atualizarParticipante(10, 'Novo Nome');

            // ASSERT
            expect(prismaMock.ranking.update).toHaveBeenCalledWith({
                where: { codRanking: 10 },
                data: { usuario: 'Novo Nome' }
            });
            expect(resultado.usuario).toBe('Novo Nome');
        });

        it('Erro: Deve lançar erro se o participante não for encontrado', async () => {
            prismaMock.ranking.update.mockRejectedValue(new Error('Record to update not found.'));

            await expect(ParticipanteService.atualizarParticipante(999, 'X'))
                .rejects.toThrow('Record to update not found');
        });
    });
})