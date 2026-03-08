import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import JogoPage from './JogoPage';

// --- CONFIGURAÇÃO DE MOCKS GLOBAIS ---

// 1. Mock do React Router
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
        useParams: () => ({ codNivel: '1' }),
    };
});

// 2. Mock do Tutorial
vi.mock('../../components/GameTutorial/GameTutorial', () => ({
    default: ({ isActive }: { isActive: boolean }) => (
        isActive ? <div data-testid="mock-tutorial">TUTORIAL ATIVO</div> : null
    )
}));

// 3. Mock do Histórico (Modal)
vi.mock('../../components/GameHistoryModal/GameHistoryModal', () => ({
    default: ({ isOpen }: { isOpen: boolean }) => (
        <div data-testid="mock-history-modal" data-isopen={isOpen}>MODAL HISTORICO</div>
    )
}));

// 4. Mock da Tabela Periódica
vi.mock('../../components/TabelaPeriodicaInterativa/TabelaPeriodicaInterativa', () => ({
    default: ({ onPosicaoClick }: { onPosicaoClick: (val: string) => void }) => (
        <div data-testid="tabela-mock">
            <button onClick={() => onPosicaoClick('hidrogenio')}>Posição H</button>
            <button onClick={() => onPosicaoClick('helio')}>Posição He</button>
            <button onClick={() => onPosicaoClick('errado')}>Posição Errada</button>
        </div>
    )
}));

// --- DADOS MOCKADOS ---
const mockData = {
    listaOpcoes: [
        // imgUrl nulo força o fallback para '.jpg', permitindo testar o onError
        { nome: 'hidrogenio', simbolo: 'H', imgUrl: null, imgDistribuicao: '/img/dist/h.png' },
        // Caminho do upload para testar o fallback correto da base url
        { nome: 'helio', simbolo: 'He', imgUrl: '/uploads/he.png' }
    ],
    rodadas: [
        {
            nomeElemento: 'hidrogenio',
            posicaoElemento: 'hidrogenio',
            dicas: ['Dica 1', 'Dica 2', 'Dica 3']
        },
        {
            nomeElemento: 'helio',
            posicaoElemento: 'helio',
            dicas: ['Dica Helio']
        }
    ]
};

describe('Página JogoPage', () => {
    const originalAudio = window.Audio;
    let playMock: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();

        localStorage.setItem('bigbang_tutorial_v5', 'true');
        sessionStorage.setItem('jogo_ativo', 'true');
        localStorage.setItem('playerName', 'Tester');

        window.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockData,
        }) as unknown as typeof fetch;

        // --- MOCK DO AUDIO ---
        playMock = vi.fn().mockResolvedValue(undefined);
        class AudioMock {
            volume = 1;
            play = playMock;
            pause = vi.fn();
            catch = vi.fn(); // Evita erros no console durante testes
        }
        window.Audio = AudioMock as any;
    });

    afterEach(() => {
        window.Audio = originalAudio;
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    const renderPage = () => render(
        <BrowserRouter>
            <JogoPage />
        </BrowserRouter>
    );

    // =========================================================================
    // 1. INICIALIZAÇÃO E ERROS DA API
    // =========================================================================

    it('Deve redirecionar para Home se não houver permissão no sessionStorage', () => {
        sessionStorage.removeItem('jogo_ativo');
        renderPage();
        expect(mockedNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('Deve exibir erro se a API falhar (Erro de Rede)', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        window.fetch = vi.fn().mockRejectedValue(new Error('Falha na API')) as unknown as typeof fetch;

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Erro: Falha na API/i)).toBeInTheDocument();
        });
        consoleSpy.mockRestore();
    });

    it('Deve exibir erro se a API retornar dados malformados', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        window.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ rodadas: 'NaoSouArray' }), // Falha na validação Array.isArray
        }) as unknown as typeof fetch;

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/A API retornou dados em um formato inesperado/i)).toBeInTheDocument();
        });
        consoleSpy.mockRestore();
    });

    it('Deve renderizar o jogo corretamente após carregar', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText(/Clique em DICAS para começar/i)).toBeInTheDocument();
            expect(screen.getByTestId('tabela-mock')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // 2. INTERAÇÕES DE ELEMENTOS EXTRAS (UI SECUNDÁRIA)
    // =========================================================================

    it('Deve alternar a visibilidade do Diagrama de Pauling', async () => {
        renderPage();
        await waitFor(() => screen.getByText('DIAGRAMA DE PAULING'));

        // Abre
        fireEvent.click(screen.getByText('DIAGRAMA DE PAULING'));
        expect(screen.getByText('<')).toBeInTheDocument(); // Botão voltar do diagrama

        // Fecha
        fireEvent.click(screen.getByText('<'));
        expect(screen.getByText('DIAGRAMA DE PAULING')).toBeInTheDocument();
    });

    it('Deve navegar para home e abrir o modal de ajuda', async () => {
        renderPage();
        await waitFor(() => screen.getByAltText('Home'));

        fireEvent.click(screen.getByAltText('Home'));
        expect(mockedNavigate).toHaveBeenCalledWith('/');

        fireEvent.click(screen.getByAltText('Ajuda'));
        expect(screen.getByTestId('mock-tutorial')).toBeInTheDocument();
    });

    it('Deve interagir com o botão Ver Detalhes (Hover e Click)', async () => {
        renderPage();
        await waitFor(() => screen.getByText('Ver detalhes'));
        const btnDetalhes = screen.getByText('Ver detalhes');

        // Dispara o evento de mouse entrar
        fireEvent.mouseEnter(btnDetalhes);

        // Verifica a propriedade no objeto de estilo da tag HTML diretamente
        expect(btnDetalhes.style.backgroundColor).toBe('rgb(21, 210, 163)');
        expect(btnDetalhes.style.color).toBe('rgb(17, 17, 17)'); // que é o #111

        // Dispara o evento de mouse sair
        fireEvent.mouseLeave(btnDetalhes);

        // Verifica se voltou a ser transparente
        expect(btnDetalhes.style.backgroundColor).toBe('transparent');

        // Testa abrir Modal Histórico (o click)
        fireEvent.click(btnDetalhes);
        expect(screen.getByTestId('mock-history-modal')).toHaveAttribute('data-isopen', 'true');
    });

    it('Deve realizar o fallback de imagem no onError (trocar .jpg por .png)', async () => {
        renderPage();
        // hidrogenio tem imgUrl=null no mock, então cai no .jpg
        await waitFor(() => screen.getByAltText('hidrogenio'));

        const img = screen.getByAltText('hidrogenio') as HTMLImageElement;
        expect(img.src).toContain('.jpg');

        // Dispara o erro de carregamento (Broken Image)
        fireEvent.error(img);

        // Verifica se a função no onError trocou o source para .png
        expect(img.src).toContain('.png');
    });

    // =========================================================================
    // 3. O FLUXO DO JOGO E EVENTOS
    // =========================================================================

    it('Deve alertar se clicar na tabela ANTES de selecionar o elemento na lateral', async () => {
        renderPage();
        await waitFor(() => screen.getByTestId('tabela-mock'));

        fireEvent.click(screen.getByText('DICAS'));

        // Clica na tabela sem escolher a imagem
        fireEvent.click(screen.getByText('Posição H'));

        expect(screen.getByText(/Selecione um elemento da lista/i)).toBeInTheDocument();
    });

    it('Deve permitir fluxo completo (Acerto Elemento + Acerto Posição)', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderPage();

        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        // 1. DICA
        fireEvent.click(screen.getByText('DICAS'));
        expect(screen.getByText('1 - Dica 1')).toBeInTheDocument();

        // 2. ELEMENTO CERTO
        fireEvent.click(screen.getByAltText('hidrogenio'));
        expect(screen.getByText(/ACERTOU/i)).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(2000); });

        // 3. POSIÇÃO CERTA
        const btnPosicao = await screen.findByText('Posição H');
        fireEvent.click(btnPosicao);
        expect(screen.getByText(/POSIÇÃO CORRETA/i)).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(2000); });

        // Confirma Rodada 2
        await waitFor(() => {
            expect(screen.getByText(/RODADA 2/i)).toBeInTheDocument();
        });
    });

    it('Deve ir para a próxima rodada caso erre o elemento escolhido', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderPage();
        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        fireEvent.click(screen.getByText('DICAS'));

        // Elemento ERRADO
        fireEvent.click(screen.getByAltText('helio'));
        expect(screen.getByText(/ERROU/i)).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(2000); });

        // Rodada avançou
        await waitFor(() => {
            expect(screen.getByText(/RODADA 2/i)).toBeInTheDocument();
        });
    });

    it('Deve ir para a próxima rodada caso erre a posição na tabela', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderPage();
        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        fireEvent.click(screen.getByText('DICAS'));
        fireEvent.click(screen.getByAltText('hidrogenio'));
        act(() => { vi.advanceTimersByTime(2000); });

        // POSIÇÃO ERRADA
        const btnErro = await screen.findByText('Posição Errada');
        fireEvent.click(btnErro);
        expect(screen.getByText(/Posição incorreta/i)).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(2000); });

        await waitFor(() => {
            expect(screen.getByText(/RODADA 2/i)).toBeInTheDocument();
        });
    });

    it('Deve exibir todas as dicas e testar o bloqueio do botão', async () => {
        renderPage();
        await waitFor(() => expect(screen.getByText('DICAS')).toBeInTheDocument());

        const btnDica = screen.getByText('DICAS');

        // Clica 3 vezes (temos 3 dicas mockadas na Rodada 1)
        fireEvent.click(btnDica);
        await waitFor(() => expect(screen.getByText('1 - Dica 1')).toBeInTheDocument());

        fireEvent.click(btnDica);
        await waitFor(() => expect(screen.getByText('2 - Dica 2')).toBeInTheDocument());

        fireEvent.click(btnDica);
        await waitFor(() => expect(screen.getByText('3 - Dica 3')).toBeInTheDocument());

        // Agora o botão deve ficar disabled
        await waitFor(() => {
            expect(btnDica).toBeDisabled();
        });
    });

    // =========================================================================
    // 4. FIM DE JOGO
    // =========================================================================

    it('Deve finalizar o jogo com sucesso e submeter pontuação', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        const dadosCurtos = { ...mockData, rodadas: [mockData.rodadas[0]] };
        window.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => dadosCurtos,
        }) as unknown as typeof fetch;

        renderPage();
        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        fireEvent.click(screen.getByText('DICAS'));
        fireEvent.click(screen.getByAltText('hidrogenio'));
        act(() => { vi.advanceTimersByTime(2000); });

        fireEvent.click(await screen.findByText('Posição H'));
        act(() => { vi.advanceTimersByTime(2000); });

        // Verifica render Fim de Jogo e POST API
        await waitFor(() => {
            expect(screen.getByAltText('Fim de Jogo')).toBeInTheDocument();
        });

        expect(window.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/submeter-pontuacao'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('Deve tratar falha no envio (catch) ao submeter a pontuação', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        // Espia o console.error que está dentro do catch do submeterPontuacao
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const dadosCurtos = { ...mockData, rodadas: [mockData.rodadas[0]] };

        // O primeiro fetch dá Ok (Busca dados iniciais)
        // O segundo dá Erro (Submeter Ponto no final do jogo)
        window.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => dadosCurtos })
            .mockRejectedValueOnce(new Error('Network offline'));

        renderPage();
        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        // Joga a única rodada para forçar o fim do jogo
        fireEvent.click(screen.getByText('DICAS'));
        fireEvent.click(screen.getByAltText('hidrogenio'));
        act(() => { vi.advanceTimersByTime(2000); });

        fireEvent.click(await screen.findByText('Posição H'));

        // Avança o tempo para fechar a rodada e disparar o useEffect de fim de jogo
        act(() => { vi.advanceTimersByTime(2000); });

        // Aguarda a tela de Fim de Jogo aparecer
        await waitFor(() => {
            expect(screen.getByAltText('Fim de Jogo')).toBeInTheDocument();
        });

        // Verifica se o catch foi ativado pelo log de erro
        expect(consoleSpy).toHaveBeenCalledWith(
            'Falha ao submeter pontuação:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });
});