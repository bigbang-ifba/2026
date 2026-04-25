import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FimDeJogo from './FimDeJogo';

// --- MOCKS ---
const mockedNavigate = vi.fn();

// Mock do React Router para capturar a navegação
vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
    };
});

describe('Componente FimDeJogo', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const propsPadrao = {
        pontuacao: 150,
        nivel: 'CURIOSO',
        nomeJogador: 'Mestre dos Elementos',
        historico: [],
    };

    // =========================================================================
    // 1. HAPPY PATH (Renderização correta dos dados)
    // =========================================================================

    it('Deve renderizar corretamente as informações do jogador', () => {
        render(<FimDeJogo {...propsPadrao} />);

        expect(screen.getByText('Nível: CURIOSO')).toBeInTheDocument();
        expect(screen.getByText('Nome: Mestre dos Elementos')).toBeInTheDocument();
        expect(screen.getByText('Pontuação: 150 pts')).toBeInTheDocument();
    });

    it('Deve renderizar as imagens decorativas (Troféus e Finish)', () => {
        render(<FimDeJogo {...propsPadrao} />);

        const trofeus = screen.getAllByAltText('Troféu');
        expect(trofeus).toHaveLength(2);

        expect(screen.getByAltText('Fim de Jogo')).toBeInTheDocument();
    });

    // =========================================================================
    // 2. TESTES DE INTERAÇÃO (Navegação)
    // =========================================================================

    it('Deve navegar para a página de Ranking ao clicar no botão correspondente', () => {
        render(<FimDeJogo {...propsPadrao} />);

        const btnRanking = screen.getByTitle('Ver Ranking');
        fireEvent.click(btnRanking);

        expect(mockedNavigate).toHaveBeenCalledWith('/ranking');
    });

    it('Deve navegar para a Home ao clicar no botão Início', () => {
        render(<FimDeJogo {...propsPadrao} />);

        const btnHome = screen.getByTitle('Início');
        fireEvent.click(btnHome);

        expect(mockedNavigate).toHaveBeenCalledWith('/');
    });

    // =========================================================================
    // 3. UNHAPPY PATH / EDGE CASES (Comportamento Visual)
    // =========================================================================

    it('Deve esconder a imagem do ícone de ranking se ela falhar ao carregar', () => {
        render(<FimDeJogo {...propsPadrao} />);

        const imgRanking = screen.getByAltText('Ranking');

        expect(imgRanking).not.toHaveStyle({ display: 'none' });

        fireEvent.error(imgRanking);

        expect(imgRanking).toHaveStyle({ display: 'none' });
    });
});
