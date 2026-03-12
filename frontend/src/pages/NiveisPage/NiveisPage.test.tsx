import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import NiveisPage from './NiveisPage';
import '@testing-library/jest-dom';

// --- MOCKS ---
const mockNiveisData = [
    { codNivel: 1, nome: 'INICIANTE' },
    { codNivel: 2, nome: 'CURIOSO' },
    { codNivel: 3, nome: 'CIENTISTA' }
];

describe('Página NiveisPage', () => {
    const originalAudio = window.Audio;
    let playMock: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        window.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockNiveisData,
        }) as unknown as typeof fetch;

        playMock = vi.fn().mockResolvedValue(undefined);

        window.Audio = vi.fn().mockImplementation(function() {
            return {
                play: playMock,
                volume: 1,
            } as unknown as HTMLAudioElement;
        }) as unknown as typeof window.Audio;
    });

    afterEach(() => {
        window.Audio = originalAudio;
        vi.restoreAllMocks();
    });

    const renderPage = () => {
        return render(
            <BrowserRouter>
                <NiveisPage />
            </BrowserRouter>
        );
    };

    // --- TESTES ---

    it('Deve mostrar "Carregando..." enquanto busca dados', () => {
        window.fetch = vi.fn().mockReturnValue(new Promise(() => {})) as unknown as typeof fetch;

        renderPage();
        expect(screen.getByText(/Carregando.../i)).toBeInTheDocument();
    });

    it('Deve exibir mensagem de erro se a API falhar', async () => {
        // Simula erro 500
        window.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Erro:/i)).toBeInTheDocument();
        });
    });

    it('Deve renderizar as imagens dos 3 níveis quando a API retornar sucesso', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByAltText('INICIANTE')).toBeInTheDocument();
            expect(screen.getByAltText('CURIOSO')).toBeInTheDocument();
            expect(screen.getByAltText('CIENTISTA')).toBeInTheDocument();
        });
    });

    it('Deve ter os links corretos para a seleção de perfil', async () => {
        renderPage();
        await waitFor(() => screen.getByAltText('INICIANTE'));

        const linkIniciante = screen.getByAltText('INICIANTE').closest('a');
        const linkCurioso = screen.getByAltText('CURIOSO').closest('a');

        expect(linkIniciante).toHaveAttribute('href', '/jogo/selecao-perfil/1');
        expect(linkCurioso).toHaveAttribute('href', '/jogo/selecao-perfil/2');
    });

    it('Deve tocar o som ao clicar no container do nível', async () => {
        renderPage();
        await waitFor(() => screen.getByAltText('INICIANTE'));

        const imgNivel1 = screen.getByAltText('INICIANTE');
        fireEvent.click(imgNivel1);

        expect(window.Audio).toHaveBeenCalledWith('/musica/selecao-nivel.wav');
        expect(playMock).toHaveBeenCalled();
    });

    it('Deve ter um botão de voltar para o menu', async () => {
        renderPage();
        await waitFor(() => screen.getByAltText('INICIANTE'));

        const btnVoltar = screen.getByTitle('Voltar'); // O botão voltar de fato tem a tag title="Voltar"
        expect(btnVoltar).toBeInTheDocument();

        const linkVoltar = btnVoltar.closest('a');
        expect(linkVoltar).toHaveAttribute('href', '/');
    });

    it('Deve ignorar níveis desconhecidos que não estão na configuração', async () => {
        // Mock retornando um nível válido (1) e um inválido (99)
        const dadosMisturados = [
            { codNivel: 1, nome: 'INICIANTE' },
            { codNivel: 99, nome: 'ALIENIGENA' } // Nível que não existe no LEVEL_CONFIG
        ];

        window.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => dadosMisturados,
        }) as unknown as typeof fetch;

        renderPage();

        await waitFor(() => {
            expect(screen.getByAltText('INICIANTE')).toBeInTheDocument();
            expect(screen.queryByAltText(/ALIENIGENA/i)).not.toBeInTheDocument();
        });
    });
});