import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as JogoService from './jogoService';
import prisma from '../../prismaClient';
import { DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

// 1. Setup do Mock do Prisma
vi.mock('../../prismaClient', async () => {
    const actual = await vi.importActual<typeof import('vitest-mock-extended')>('vitest-mock-extended');
    return {
        __esModule: true,
        default: actual.mockDeep<PrismaClient>(),
    };
});

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Jogo Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- GET NIVEIS ---
    describe('getNiveis', () => {
        it('Deve retornar lista de níveis ordenada', async () => {
            const mockNiveis = [
                { codNivel: 1, nivel: 'INICIANTE' },
                { codNivel: 2, nivel: 'CURIOSO' }
            ];
            prismaMock.nivel.findMany.mockResolvedValue(mockNiveis as any);

            const result = await JogoService.getNiveis();

            expect(prismaMock.nivel.findMany).toHaveBeenCalledWith({
                orderBy: { codNivel: 'asc' }
            });
            expect(result).toEqual(mockNiveis);
        });
    });

    // --- GET QUESTAO COM DICAS ---
    describe('getQuestaoComDicas', () => {
        const criarQuestaoMock = (id: number, resposta: string | null = null) => ({
            codQuestao: id,
            codNivel: 1,
            // Se não passar resposta, cria uma única: 'Resp 1', 'Resp 2', etc.
            resposta: resposta ?? `Resp ${id}`,
            simbolo: `Sym${id}`,
            imagemUrl: `/img/${id}.png`,
            imgDistribuicao: `/dist/${id}.png`
        });

        it('Sucesso: Deve retornar até 12 questões com dicas mapeadas', async () => {
            // ARRANGE
            const mockQuestoes = Array.from({ length: 15 }, (_, i) => criarQuestaoMock(i + 1));

            const mockDicas = [
                { codDica: 1, codQuestao: 1, dica: 'Dica Q1' },
                { codDica: 2, codQuestao: 2, dica: 'Dica Q2' }
            ];

            prismaMock.questao.findMany.mockResolvedValue(mockQuestoes as any);
            prismaMock.dicas.findMany.mockResolvedValue(mockDicas as any);

            // ACT
            const result = await JogoService.getQuestaoComDicas(1);

            // ASSERT
            expect(prismaMock.questao.findMany).toHaveBeenCalledWith({ where: { codNivel: 1 } });

            // Verifica limite
            expect(result.listaOpcoes).toHaveLength(12);
            expect(result.rodadas).toHaveLength(12);

            const primeiraOpcao = result.listaOpcoes[0];
            expect(primeiraOpcao).toBeDefined();
            expect(primeiraOpcao).toHaveProperty('imgUrl');

            const rodadaQ1 = result.rodadas.find(r => r.nomeElemento === 'Resp 1');

            const questaoComDicaEncontrada = result.rodadas.find(r =>
                r.nomeElemento === 'Resp 1' || r.nomeElemento === 'Resp 2'
            );

            if (questaoComDicaEncontrada) {
                if (questaoComDicaEncontrada.nomeElemento === 'Resp 1') {
                    expect(questaoComDicaEncontrada.dicas).toContain('Dica Q1');
                } else {
                    expect(questaoComDicaEncontrada.dicas).toContain('Dica Q2');
                }
            }
        });

        it('Sucesso: A ordem das opções não deve seguir a ordem das rodadas', async () => {
            // ARRANGE
            const mockQuestoes = Array.from({ length: 15 }, (_, i) => criarQuestaoMock(i + 1));
            prismaMock.questao.findMany.mockResolvedValue(mockQuestoes as any);
            prismaMock.dicas.findMany.mockResolvedValue([]);

            // ACT: várias chamadas, pois o embaralhamento é aleatório
            const resultados = [];
            for (let i = 0; i < 5; i++) {
                resultados.push(await JogoService.getQuestaoComDicas(1));
            }

            // ASSERT
            for (const result of resultados) {
                // As opções continuam sendo exatamente os elementos das rodadas
                expect([...result.listaOpcoes.map(o => o.nome)].sort())
                    .toEqual([...result.rodadas.map(r => r.nomeElemento)].sort());
            }

            // Mas a posição na lista não pode coincidir com a ordem das rodadas,
            // senão bastaria clicar na primeira opção habilitada para acertar sempre.
            const algumaOrdemDiferente = resultados.some(result =>
                result.listaOpcoes.some((opcao, index) =>
                    opcao.nome !== result.rodadas[index]!.nomeElemento
                )
            );
            expect(algumaOrdemDiferente).toBe(true);
        });

        it('Sucesso: Deve tratar símbolo nulo como "?"', async () => {
            const questaoSemSimbolo = { ...criarQuestaoMock(1), simbolo: null };
            prismaMock.questao.findMany.mockResolvedValue([questaoSemSimbolo] as any);
            prismaMock.dicas.findMany.mockResolvedValue([]);

            const result = await JogoService.getQuestaoComDicas(1);

            expect(result.listaOpcoes[0].simbolo).toBe('?');
        });

        it('Erro: Deve lançar erro se não encontrar questões no nível', async () => {
            prismaMock.questao.findMany.mockResolvedValue([]);

            await expect(JogoService.getQuestaoComDicas(99))
                .rejects.toThrow(/Nenhuma questão encontrada/);
        });

        it('Erro: Deve lançar erro se houver questões mas sem resposta válida', async () => {
            const questaoInvalida = criarQuestaoMock(1, null); // Resposta null
            const qManual = {
                codQuestao: 1, codNivel: 1, resposta: null, simbolo: 'S', imagemUrl: null, imgDistribuicao: null
            };

            prismaMock.questao.findMany.mockResolvedValue([qManual] as any);

            await expect(JogoService.getQuestaoComDicas(1))
                .rejects.toThrow(/nenhuma possui resposta válida/);
        });
    });

    // --- SUBMIT PONTUACAO ---
    describe('submitPontuacao', () => {
        const dadosValidos = {
            usuario: 'Junior',
            pontuacao: 100,
            nivel: 'CIENTISTA' as const
        };

        it('Sucesso: Deve salvar pontuação no banco', async () => {
            prismaMock.ranking.create.mockResolvedValue({ id: 1, ...dadosValidos } as any);

            await JogoService.submitPontuacao(dadosValidos);

            expect(prismaMock.ranking.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    usuario: 'Junior',
                    pontuacao: 100,
                    nivel: 'CIENTISTA',
                    data_hora: expect.any(Date)
                })
            });
        });

        it('Erro: Deve lançar erro se faltar dados', async () => {
            // @ts-ignore
            await expect(JogoService.submitPontuacao({ usuario: '' }))
                .rejects.toThrow("Dados incompletos.");
        });
    });
});