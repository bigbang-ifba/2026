import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import AdminParticipantesPage from './AdminParticipantesPage';
import toast from 'react-hot-toast';

// --- MOCKS GLOBAIS ---

// 1. Mock do Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock do window.confirm
let confirmSpy: Mock;

// --- DADOS MOCKADOS ---
const mockParticipantes = [
    { codRanking: 101, usuario: 'Jogador 1', pontuacao: 100, nivel: 'INICIANTE' },
    { codRanking: 102, usuario: 'Jogador 2', pontuacao: 200, nivel: 'CURIOSO' },
    { codRanking: 103, usuario: 'Jogador 3', pontuacao: 300, nivel: 'CIENTISTA' },
    { codRanking: 104, usuario: 'Jogador 4', pontuacao: 400, nivel: 'ESTRANHO' } // Nível fora do padrão para cobertura do render
];

const mockRespostaAPI = {
    data: mockParticipantes,
    total: 4,
    pagina: 1,
    totalPaginas: 2
};

// --- HELPERS ---

const setupSession = (podeExcluir: boolean, invalidJson = false) => {
    sessionStorage.setItem('token', 'fake-token');
    if (invalidJson) {
        sessionStorage.setItem('adminUser', 'invalid-json{');
    } else {
        sessionStorage.setItem('adminUser', JSON.stringify({
            id: 1,
            isSuperAdmin: false,
            podeExcluirParticipantes: podeExcluir
        }));
    }
};

describe('Página AdminParticipantesPage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();

        confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true) as unknown as Mock;
        vi.spyOn(console, 'error').mockImplementation(() => {});

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockRespostaAPI,
        });

        // Habilita timers falsos para testar o setTimeout (debounce)
        vi.useFakeTimers({ shouldAdvanceTime: true });

        setupSession(true);
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const renderAndLoad = async () => {
        render(<AdminParticipantesPage />);
        // Avança o debounce inicial
        await act(async () => { vi.advanceTimersByTime(550); });
    };

    // =========================================================================
    // 1. RENDERIZAÇÃO E PERMISSÕES
    // =========================================================================

    it('Deve renderizar a tabela com participantes carregados (Incluindo níveis exóticos)', async () => {
        await renderAndLoad();

        await waitFor(() => {
            expect(screen.getByText('Jogador 1')).toBeInTheDocument();
            expect(screen.getByText('INICIANTE')).toBeInTheDocument();
            // Verifica o fallback do nível que não é os 3 principais
            expect(screen.getByText('ESTRANHO')).toBeInTheDocument();
        });
    });

    it('Deve tratar falha no JSON do sessionStorage (Catch do parse)', async () => {
        setupSession(false, true); // JSON inválido
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await renderAndLoad();

        expect(consoleSpy).toHaveBeenCalledWith("Erro ao ler permissões", expect.anything());
    });

    it('Deve renderizar mensagem quando a lista for vazia', async () => {
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [], totalPaginas: 1 })
        });

        await renderAndLoad();

        expect(screen.getByText('Nenhum participante encontrado.')).toBeInTheDocument();
    });

    // =========================================================================
    // 2. HAPPY PATH E INTERAÇÕES (FILTROS E PAGINAÇÃO)
    // =========================================================================

    it('Deve fazer busca por texto via input com debounce', async () => {
        await renderAndLoad();
        (globalThis.fetch as Mock).mockClear();

        const inputBusca = screen.getByPlaceholderText(/Buscar participante/i);
        fireEvent.change(inputBusca, { target: { value: 'JogadorX' } });

        await act(async () => { vi.advanceTimersByTime(550); });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('busca=JogadorX'),
            expect.anything()
        );
    });

    it('Deve atualizar a lista ao clicar nos filtros de Rádio (Níveis)', async () => {
        await renderAndLoad();
        (globalThis.fetch as Mock).mockClear();

        // Clica no filtro Cientista
        const radioCientista = screen.getByLabelText('Cientista');
        fireEvent.click(radioCientista);

        await act(async () => { vi.advanceTimersByTime(550); });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('nivel=CIENTISTA'),
            expect.anything()
        );
    });

    it('Deve paginar corretamente ao clicar em Próxima e Anterior', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Página 1 de 2'));

        (globalThis.fetch as Mock).mockClear();

        // Clica em Próxima
        const btnProxima = screen.getByText('Próxima');
        fireEvent.click(btnProxima);

        await act(async () => { vi.advanceTimersByTime(550); });

        expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.anything());

        (globalThis.fetch as Mock).mockClear();

        // Clica em Anterior
        const btnAnterior = screen.getByText('Anterior');
        fireEvent.click(btnAnterior);

        await act(async () => { vi.advanceTimersByTime(550); });

        expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('page=1'), expect.anything());
    });

    it('Deve excluir um participante após confirmação e recarregar a lista', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Jogador 2'));

        (globalThis.fetch as Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // Sucesso no Delete
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI }); // Recarregamento

        confirmSpy.mockReturnValue(true);

        const btnsExcluir = screen.getAllByTitle('Excluir participante');
        fireEvent.click(btnsExcluir[1]);

        await act(async () => { vi.advanceTimersByTime(550); }); // Aguarda possível debounce de reload

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/participantes/102'),
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(toast.success).toHaveBeenCalledWith('Participante excluído!');
    });

    it('Deve abrir o modal ao clicar em "Nome" e salvar a edição', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Jogador 1'));

        (globalThis.fetch as Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }) // Put
            .mockResolvedValueOnce({ ok: true, json: async () => mockRespostaAPI }); // Reload

        // Abre modal
        const btnsEditar = screen.getAllByText('✏️ Nome');
        fireEvent.click(btnsEditar[0]);

        const modalTitle = await screen.findByText('Editar: Jogador 1');
        expect(modalTitle).toBeInTheDocument();

        // Edita o input
        const inputNome = screen.getByDisplayValue('Jogador 1');
        fireEvent.change(inputNome, { target: { value: 'Nome Editado' } });

        // Salva
        const btnSalvar = screen.getByText('Salvar Alterações');
        fireEvent.click(btnSalvar);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Nome alterado para "Nome Editado"!');
        });
    });

    // =========================================================================
    // 3. UNHAPPY PATH (ERROS GERAIS E VALIDAÇÕES)
    // =========================================================================

    it('Deve exibir erro no toast se o Modal enviar nome vazio ou apenas espaços', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Jogador 1'));

        fireEvent.click(screen.getAllByText('✏️ Nome')[0]);

        // Limpa o nome com espaços
        const inputNome = await screen.findByDisplayValue('Jogador 1');
        fireEvent.change(inputNome, { target: { value: '   ' } });

        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(toast.error).toHaveBeenCalledWith('O nome não pode estar vazio');
    });

    it('Deve tratar o bloco Catch (Erro de Rede) ao salvar o nome', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Jogador 1'));

        // Força o erro de rede
        (globalThis.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

        fireEvent.click(screen.getAllByText('✏️ Nome')[0]);
        fireEvent.click(await screen.findByText('Salvar Alterações'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro de conexão.');
        });
    });

    it('Deve tratar o bloco Catch (Erro de Rede) ao excluir participante', async () => {
        await renderAndLoad();
        await waitFor(() => screen.getByText('Jogador 1'));

        confirmSpy.mockReturnValue(true);
        (globalThis.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

        fireEvent.click(screen.getAllByTitle('Excluir participante')[0]);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao excluir.');
        });
    });

    it('Deve exibir mensagem de erro de API (res.ok = false) ao carregar a lista', async () => {
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: false,
            status: 403
        });

        await renderAndLoad();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao carregar lista.');
        });
    });

    it('Deve tratar erro de rede / trycatch ao carregar lista (Catch Geral)', async () => {
        (globalThis.fetch as Mock).mockRejectedValueOnce(new Error('CORS ERROR'));

        await renderAndLoad();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro de conexão.');
        });
    });

    it('Não deve tentar excluir se o botão estiver desabilitado (Permissão Negada)', async () => {
        setupSession(false);
        await renderAndLoad();

        await waitFor(() => screen.getByText('Jogador 1'));

        (globalThis.fetch as Mock).mockClear(); // Limpa calls do render inicial
        const btnBloqueado = screen.getAllByTitle('Sem permissão para excluir')[0];

        fireEvent.click(btnBloqueado);

        expect(confirmSpy).not.toHaveBeenCalled();
        expect(globalThis.fetch).not.toHaveBeenCalled(); // Não disparou o delete
    });
});