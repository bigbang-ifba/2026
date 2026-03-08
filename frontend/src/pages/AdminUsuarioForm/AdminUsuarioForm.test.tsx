import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminUsuarioForm from './AdminUsuarioForm';
import toast from 'react-hot-toast';

// --- CONFIGURAÇÃO DOS MOCKS ---

// 1. Mock do React Router
const mockedNavigate = vi.fn();
// Objeto mutável para simular a mudança de URL
const mockedParams = { id: undefined as string | undefined };

vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
        useParams: () => mockedParams,
    };
});

// 2. Mock do Axios (USANDO VI.HOISTED PARA EVITAR REFERENCE ERROR)
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

// 3. Mock do Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// 4. Mock do Clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(),
    },
});

// --- DADOS MOCKADOS ---
const mockUsuarioExistente = {
    nome: 'Usuario Existente',
    email: 'existente@teste.com',
    isSuperAdmin: false,
    podeExcluirElementos: true,
    podeExcluirParticipantes: false,
    podeGerenciarUsuarios: false
};

const mockSuperAdmin = {
    nome: 'Super Admin',
    email: 'super@admin.com',
    isSuperAdmin: true,
    podeExcluirElementos: true,
    podeExcluirParticipantes: true,
    podeGerenciarUsuarios: true
};

describe('Página AdminUsuarioForm', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockedParams.id = undefined;
        sessionStorage.setItem('token', 'fake-token');
    });

    afterEach(() => {
        vi.useRealTimers(); // Limpeza garantida
        sessionStorage.clear();
    });

    const renderComponent = () => render(
        <BrowserRouter>
            <AdminUsuarioForm />
        </BrowserRouter>
    );

    // =========================================================================
    // 1. RENDERIZAÇÃO E MODO (NOVO vs EDITAR)
    // =========================================================================

    it('Deve renderizar formulário vazio no modo "Novo Usuário"', () => {
        mockedParams.id = undefined;
        renderComponent();

        expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
        expect(screen.getByText('Senha Inicial')).toBeInTheDocument();

        expect(screen.getByPlaceholderText('Ex: João da Silva')).toHaveValue('');
    });

    it('Deve carregar dados e renderizar no modo "Editar Usuário"', async () => {
        mockedParams.id = '123';
        mockApi.get.mockResolvedValueOnce({ data: mockUsuarioExistente });

        renderComponent();

        expect(screen.getByText('Editar Usuário')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Usuario Existente')).toBeInTheDocument();
            expect(screen.getByDisplayValue('existente@teste.com')).toBeInTheDocument();
        });

        const checkExcluir = screen.getByLabelText(/Pode Excluir Elementos/i);
        expect(checkExcluir).toBeChecked();
    });

    it('Deve exibir badge de Super Admin e desabilitar campos sensíveis', async () => {
        mockedParams.id = '999';
        mockApi.get.mockResolvedValueOnce({ data: mockSuperAdmin });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('👑 Super Admin')).toBeInTheDocument();
        });

        expect(screen.getByPlaceholderText('usuario@bigbang.com')).toBeDisabled();

        const checkPerm = screen.getByLabelText(/Pode Excluir Elementos/i);
        expect(checkPerm).toBeDisabled();
        expect(checkPerm).toBeChecked();
    });

    // =========================================================================
    // 2. HAPPY PATH E INTERAÇÕES NA UI
    // =========================================================================

    it('Deve navegar para cancelar ao clicar no botão "Cancelar"', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Cancelar'));
        expect(mockedNavigate).toHaveBeenCalledWith('/admin/usuarios');
    });

    it('Deve alterar as permissões ao clicar nos checkboxes e enviar no payload', async () => {
        mockedParams.id = undefined;
        mockApi.post.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Ex: João da Silva'), { target: { value: 'User Perms' } });
        fireEvent.change(screen.getByPlaceholderText('usuario@bigbang.com'), { target: { value: 'perms@t.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: '123' } });

        // Clica nos 3 checkboxes para ativá-los
        fireEvent.click(screen.getByLabelText(/Pode Excluir Elementos/i));
        fireEvent.click(screen.getByLabelText(/Pode Excluir Participantes/i));
        fireEvent.click(screen.getByLabelText(/Pode Gerenciar Usuários/i));

        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(mockApi.post).toHaveBeenCalledWith('/usuarios', expect.objectContaining({
                podeExcluirElementos: true,
                podeExcluirParticipantes: true,
                podeGerenciarUsuarios: true
            }), expect.anything());
        });
    });

    it('Deve gerar uma senha aleatória ao clicar em "Gerar"', async () => {
        renderComponent();

        const inputSenha = screen.getByPlaceholderText('******');
        const btnGerar = screen.getByText('🎲 Gerar');
        fireEvent.click(btnGerar);

        await waitFor(() => {
            expect(inputSenha).toHaveValue();
            expect((inputSenha as HTMLInputElement).value.length).toBe(12);
            expect(toast.success).toHaveBeenCalledWith("Senha segura gerada!");
        });
    });

    it('Deve copiar a senha para o clipboard', async () => {
        renderComponent();

        const inputSenha = screen.getByPlaceholderText('******');
        fireEvent.change(inputSenha, { target: { value: 'MinhaSenha123' } });

        const btnCopiar = screen.getByText('📋 Copiar');
        fireEvent.click(btnCopiar);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MinhaSenha123');
        expect(toast.success).toHaveBeenCalledWith("Senha copiada!");
    });

    it('Deve criar um NOVO usuário com sucesso (POST) e navegar', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        mockedParams.id = undefined;
        mockApi.post.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Ex: João da Silva'), { target: { value: 'Novo User' } });
        fireEvent.change(screen.getByPlaceholderText('usuario@bigbang.com'), { target: { value: 'novo@teste.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: '123456' } });

        const btnSalvar = screen.getByText('Salvar Alterações');
        fireEvent.click(btnSalvar);

        // Aguarda a chamada da API e o Toast
        await waitFor(() => {
            expect(mockApi.post).toHaveBeenCalledWith('/usuarios', expect.objectContaining({
                nome: 'Novo User',
                email: 'novo@teste.com',
                senha: '123456'
            }), expect.anything());

            expect(toast.success).toHaveBeenCalledWith("Novo usuário criado!");
        });

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(mockedNavigate).toHaveBeenCalledWith('/admin/usuarios');
    });

    it('Deve atualizar um usuário EXISTENTE com sucesso (PUT)', async () => {
        mockedParams.id = '55';
        mockApi.get.mockResolvedValueOnce({ data: mockUsuarioExistente });
        mockApi.put.mockResolvedValueOnce({ data: { success: true } });

        renderComponent();
        await waitFor(() => screen.getByDisplayValue('Usuario Existente'));

        fireEvent.change(screen.getByDisplayValue('Usuario Existente'), { target: { value: 'Nome Editado' } });

        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(mockApi.put).toHaveBeenCalledWith('/usuarios/55', expect.objectContaining({
                nome: 'Nome Editado'
            }), expect.anything());

            expect(toast.success).toHaveBeenCalledWith("Usuário atualizado com sucesso!");
        });
    });

    // =========================================================================
    // 3. UNHAPPY PATH E VALIDAÇÕES
    // =========================================================================

    it('Deve validar campos obrigatórios (Nome/Email) antes de enviar', () => {
        renderComponent();

        const btnSalvar = screen.getByText('Salvar Alterações');
        fireEvent.click(btnSalvar);

        expect(toast.error).toHaveBeenCalledWith("Preencha nome e e-mail.");
        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('Deve exigir senha ao criar um novo usuário', () => {
        mockedParams.id = undefined;
        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Ex: João da Silva'), { target: { value: 'Teste' } });
        fireEvent.change(screen.getByPlaceholderText('usuario@bigbang.com'), { target: { value: 't@t.com' } });

        fireEvent.click(screen.getByText('Salvar Alterações'));

        expect(toast.error).toHaveBeenCalledWith("Senha é obrigatória para novos usuários.");
        expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('Deve redirecionar se falhar ao carregar dados do usuário (Erro no GET)', async () => {
        mockedParams.id = '999';
        mockApi.get.mockRejectedValueOnce(new Error('User not found'));

        renderComponent();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao carregar dados do usuário.");
            expect(mockedNavigate).toHaveBeenCalledWith('/admin/usuarios');
        });
    });

    it('Deve exibir erro customizado vindo da API ao falhar no salvamento', async () => {
        mockedParams.id = undefined;
        mockApi.post.mockRejectedValueOnce({
            response: {
                data: { error: 'E-mail já cadastrado!' }
            }
        });

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Ex: João da Silva'), { target: { value: 'Teste' } });
        fireEvent.change(screen.getByPlaceholderText('usuario@bigbang.com'), { target: { value: 'dup@t.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: '123' } });

        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('E-mail já cadastrado!');
        });
    });

    it('Deve exibir erro genérico ao falhar no salvamento (erro de rede/sem response.data)', async () => {
        mockedParams.id = undefined;
        // Simula erro de rede sem o objeto response do axios
        mockApi.post.mockRejectedValueOnce(new Error('Network Error'));

        renderComponent();

        fireEvent.change(screen.getByPlaceholderText('Ex: João da Silva'), { target: { value: 'Teste' } });
        fireEvent.change(screen.getByPlaceholderText('usuario@bigbang.com'), { target: { value: 'teste@t.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: '123' } });

        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Erro ao salvar.');
        });
    });

    it('Deve exibir erro ao tentar copiar senha vazia', () => {
        renderComponent();
        fireEvent.click(screen.getByText('📋 Copiar'));

        expect(toast.error).toHaveBeenCalledWith("Nada para copiar.");
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
});