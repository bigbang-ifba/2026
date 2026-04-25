import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminElementoForm from './AdminElementoForm';
import toast from 'react-hot-toast';

// --- MOCKS ---

// 1. React Router
const mockedNavigate = vi.fn();
const mockedParams = { id: undefined as string | undefined };

vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
        useParams: () => mockedParams,
    };
});

// 2. Axios
const mockApi = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
}));

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockApi),
    },
}));

// 3. Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// 4. URL.createObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');

// 5. Mock do PrimeReact AutoComplete (ESSENCIAL PARA O TESTE PASSAR)
vi.mock('primereact/autocomplete', () => ({
    AutoComplete: ({ value, onChange, placeholder, disabled, id }: any) => (
        <div data-testid="mock-autocomplete-container">
            <input
                data-testid="mock-autocomplete-input"
                placeholder={placeholder}
                value={value && typeof value === 'object' ? value.n : value || ''}
                onChange={(e) => {
                    onChange({ value: e.target.value });
                }}
                disabled={disabled}
                id={id}
            />
            <button
                type="button"
                data-testid="btn-simular-selecao"
                onClick={() => onChange({ value: { s: 'Fe', n: 'Ferro' } })}
            >
                Simular Seleção Ferro
            </button>
            <button
                type="button"
                data-testid="btn-simular-limpeza"
                onClick={() => onChange({ value: null })}
            >
                Simular Limpeza
            </button>
        </div>
    )
}));

// --- DADOS MOCKADOS ---
const mockElementoExistente = {
    nome: 'Oxigênio',
    simbolo: 'O',
    nivel: 1,
    dicas: ['É um gás', 'Essencial para vida', 'Combustão'],
    imagemUrl: '/img/o.png',
    imgDistribuicao: '/img/dist/o.png'
};

describe('Página AdminElementoForm', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockedParams.id = undefined;
        sessionStorage.setItem('token', 'fake-token');
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockApi.get.mockResolvedValue({ data: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
        sessionStorage.clear();
    });

    const renderComponent = () => render(
        <BrowserRouter>
            <AdminElementoForm />
        </BrowserRouter>
    );

    // =========================================================================
    // 1. RENDERIZAÇÃO
    // =========================================================================

    it('Deve renderizar formulário vazio no modo "Novo Elemento"', async () => {
        mockedParams.id = undefined;
        renderComponent();

        expect(screen.getByText('Novo Elemento')).toBeInTheDocument();
        const inputAutoComplete = screen.getByTestId('mock-autocomplete-input');
        expect(inputAutoComplete).toBeInTheDocument();
        expect(inputAutoComplete).toHaveValue('');
        expect(screen.getByPlaceholderText('Nome confirmado')).toHaveValue('');
        expect(screen.getByPlaceholderText('Símbolo')).toHaveValue('');
    });

    it('Deve carregar dados e preencher formulário no modo "Editar"', async () => {
        mockedParams.id = '8';
        mockApi.get.mockImplementation((url) => {
            if (url === '/elementos/8') {
                return Promise.resolve({ data: mockElementoExistente });
            }
            return Promise.resolve({ data: [] });
        });

        renderComponent();
        expect(screen.getByText(/Editar:/)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByTestId('mock-autocomplete-input')).toHaveValue('Oxigênio');
            expect(screen.getByDisplayValue('É um gás')).toBeInTheDocument();
            // Verifica se a imagem atual (do mock) foi renderizada no src
            const images = screen.getAllByRole('img');
            expect(images[0]).toHaveAttribute('src', expect.stringContaining('/img/o.png'));
        });
    });

    // =========================================================================
    // 2. HAPPY PATH & INTERAÇÕES DA UI
    // =========================================================================

    it('Deve criar um NOVO elemento com sucesso e realizar upload de imagens', async () => {
        mockedParams.id = undefined;
        mockApi.post.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();

        // 1. Selecionar elemento
        fireEvent.click(screen.getByTestId('btn-simular-selecao'));
        expect(screen.getByPlaceholderText('Nome confirmado')).toHaveValue('Ferro');

        // 2. Preencher Dicas
        const inputsDica = screen.getAllByPlaceholderText(/Dica \d/);
        fireEvent.change(inputsDica[0], { target: { value: 'Metal' } });
        fireEvent.change(inputsDica[1], { target: { value: 'Magnético' } });
        fireEvent.change(inputsDica[2], { target: { value: 'Hematita' } });

        // 3. Simular upload de arquivo de imagem principal
        const file = new File(['dummy content'], 'ferro.png', { type: 'image/png' });

        // Pega os inputs type file
        const fileInputs = document.querySelectorAll('input[type="file"]');
        if(fileInputs.length > 0) {
            fireEvent.change(fileInputs[0], { target: { files: [file] } });
            // O mock do URL.createObjectURL deve ter sido chamado para o preview
            expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(file);
        }

        // 4. Salvar
        fireEvent.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(mockApi.post).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Criado com sucesso!');
        });

        act(() => { vi.advanceTimersByTime(500); });
        expect(mockedNavigate).toHaveBeenCalledWith('/admin/elementos');
    });

    it('Deve atualizar um elemento EXISTENTE com sucesso', async () => {
        mockedParams.id = '8';
        mockApi.get.mockImplementation((url) => {
            if (url === '/elementos/8') return Promise.resolve({ data: mockElementoExistente });
            return Promise.resolve({ data: [] });
        });
        mockApi.put.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();
        await waitFor(() => screen.getByTestId('mock-autocomplete-input'));

        fireEvent.click(screen.getByTestId('btn-simular-selecao'));
        fireEvent.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(mockApi.put).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Editado com sucesso!');
        });
    });

    it('Deve ocultar o campo de Cerne de Gás Nobre ao mudar nível para 2 ou 3', async () => {
        renderComponent();

        expect(screen.getByText('Cerne do Gás Nobre')).toBeInTheDocument();

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '2' } });

        expect(screen.queryByText('Cerne do Gás Nobre')).not.toBeInTheDocument();
    });

    it('Deve limpar os campos de nome e simbolo ao limpar o autocomplete', async () => {
        renderComponent();

        // Simula seleção
        fireEvent.click(screen.getByTestId('btn-simular-selecao'));
        expect(screen.getByPlaceholderText('Nome confirmado')).toHaveValue('Ferro');

        // Simula limpeza (usuário apagou o texto)
        fireEvent.click(screen.getByTestId('btn-simular-limpeza'));

        // Deve voltar para vazio
        expect(screen.getByPlaceholderText('Nome confirmado')).toHaveValue('');
        expect(screen.getByPlaceholderText('Símbolo')).toHaveValue('');
    });

    it('Deve navegar para a lista ao clicar em Voltar', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Voltar'));
        expect(mockedNavigate).toHaveBeenCalledWith('/admin/elementos');
    });

    // =========================================================================
    // 3. UNHAPPY PATH E ERROS
    // =========================================================================

    it('Deve impedir envio se campos obrigatórios estiverem vazios', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Salvar'));
        expect(toast.error).toHaveBeenCalledWith('Selecione um elemento válido.');
        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('Deve impedir envio se as dicas não estiverem completas', () => {
        renderComponent();
        fireEvent.click(screen.getByTestId('btn-simular-selecao'));

        const inputsDica = screen.getAllByPlaceholderText(/Dica \d/);
        fireEvent.change(inputsDica[0], { target: { value: 'Metal' } });

        fireEvent.click(screen.getByText('Salvar'));

        expect(toast.error).toHaveBeenCalledWith('Preencha as 3 dicas.');
        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('Deve exibir erro no toast se a API falhar ao salvar', async () => {
        mockedParams.id = undefined;
        // Simula erro da API com mensagem customizada no response
        mockApi.post.mockRejectedValueOnce({
            response: { data: { error: 'Elemento já cadastrado.' } }
        });

        renderComponent();

        fireEvent.click(screen.getByTestId('btn-simular-selecao'));

        const inputsDica = screen.getAllByPlaceholderText(/Dica \d/);
        fireEvent.change(inputsDica[0], { target: { value: 'D1' } });
        fireEvent.change(inputsDica[1], { target: { value: 'D2' } });
        fireEvent.change(inputsDica[2], { target: { value: 'D3' } });

        fireEvent.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Elemento já cadastrado.');
        });
    });

    it('Deve exibir erro se falhar ao carregar dados na edição', async () => {
        mockedParams.id = '999';
        mockApi.get.mockRejectedValueOnce(new Error('Network Error'));

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar dados.')).toBeInTheDocument();
        });
    });
});
