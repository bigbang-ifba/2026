import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Request, type Response } from 'express';
import * as ParticipanteController from './participanteController.js';
import * as ParticipanteService from '../../services/participante/participanteService.js';

const { mockListar, mockDeletar, mockAtualizar } = vi.hoisted(() => {
    return {
        mockListar: vi.fn(),
        mockDeletar: vi.fn(),
        mockAtualizar: vi.fn(),
    };
});

vi.mock('../../services/participante/participanteService.js', () => ({
    listarParticipantes: mockListar,
    deletarParticipante: mockDeletar,
    atualizarParticipante: mockAtualizar,
}));

describe('Participante Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;
    let sendMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        jsonMock = vi.fn();
        sendMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock, send: sendMock });

        req = {
            params: {},
            query: {},
            body: {},
        } as unknown as Request;

        res = {
            status: statusMock,
            json: jsonMock,
            send: sendMock
        } as unknown as Response;
    });

    // --- TESTES: LISTAR ---
    describe('listar', () => {
        it('Sucesso: Deve listar participantes com paginação padrão (1 e 10)', async () => {
            req.query = {};
            const mockResultado = { dados: [], total: 0, pagina: 1 };

            mockListar.mockResolvedValue(mockResultado);

            await ParticipanteController.listar(req as Request, res as Response);

            expect(mockListar).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(res.json).toHaveBeenCalledWith(mockResultado);
        });

        it('Sucesso: Deve usar paginação fornecida na query', async () => {
            req.query = { page: '2', limit: '20' };
            mockListar.mockResolvedValue({ dados: [] });

            await ParticipanteController.listar(req as Request, res as Response);

            expect(mockListar).toHaveBeenCalledWith(2, 20, undefined, undefined);
        });

        it('Erro: Deve retornar 500 se o service falhar', async () => {
            mockListar.mockRejectedValue(new Error('Erro DB'));

            await ParticipanteController.listar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Erro ao listar participantes' });
        });
    });

    // --- TESTES: DELETAR ---
    describe('deletar', () => {
        it('Sucesso: Deve deletar e retornar 204', async () => {
            req.params = { id: '123' };
            mockDeletar.mockResolvedValue(true);

            await ParticipanteController.deletar(req as Request, res as Response);

            expect(mockDeletar).toHaveBeenCalledWith(123);
            expect(statusMock).toHaveBeenCalledWith(204);
            expect(sendMock).toHaveBeenCalled();
        });

        it('Erro: Deve retornar 500 se o service falhar', async () => {
            req.params = { id: '123' };
            mockDeletar.mockRejectedValue(new Error('Falha'));

            await ParticipanteController.deletar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Erro ao deletar participante' });
        });
    });

    // --- TESTES: ATUALIZAR ---
    describe('atualizar', () => {
        it('Sucesso: Deve atualizar nome e retornar objeto atualizado', async () => {
            req.params = { id: '1' };
            req.body = { nome: 'Novo Nome' };
            const mockAtualizado = { id: 1, nome: 'Novo Nome' };

            mockAtualizar.mockResolvedValue(mockAtualizado);

            await ParticipanteController.atualizar(req as Request, res as Response);

            expect(mockAtualizar).toHaveBeenCalledWith(1, 'Novo Nome');
            expect(res.json).toHaveBeenCalledWith(mockAtualizado);
        });

        it('Erro: Deve retornar 500 se o service falhar', async () => {
            req.params = { id: '1' };
            mockAtualizar.mockRejectedValue(new Error('Erro'));

            await ParticipanteController.atualizar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Erro ao atualizar participante' });
        });
    });
})