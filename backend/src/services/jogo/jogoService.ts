import prisma from '../../prismaClient.js';
import { type questao } from '@prisma/client';

/**
 * 1. GET /api/jogo/niveis
 */
export const getNiveis = async () => {
    const niveis = await prisma.nivel.findMany({
        orderBy: { codNivel: 'asc' },
    });
    return niveis;
};


/**
 * Embaralha uma CÓPIA do array (Fisher-Yates), sem alterar o original.
 */
const embaralhar = <T,>(itens: T[]): T[] => {
    const copia = [...itens];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j]!, copia[i]!];
    }
    return copia;
};

export const getQuestaoComDicas = async (codNivel: number) => {

    // 1. Busca questões do nível
    const todas = await prisma.questao.findMany({
        where: { codNivel: codNivel },
    });

    if (todas.length === 0) {
        throw new Error(`Nenhuma questão encontrada para o nível ${codNivel}.`);
    }

    // 2. Filtra questões válidas (que têm resposta/nome)
    const questoesValidas = todas.filter((q: questao) => q.resposta);

    if (questoesValidas.length === 0) {
        throw new Error(`Questões encontradas, mas nenhuma possui resposta válida.`);
    }

    // 3. Busca e Mapeia as Dicas
    const questaoIds = questoesValidas.map((q: questao) => q.codQuestao);

    const todasDicas = await prisma.dicas.findMany({
        where: { codQuestao: { in: questaoIds } },
        orderBy: { codDica: 'asc' }
    });

    const dicasMap = new Map<number, string[]>();
    for (const d of todasDicas) {
        if (!dicasMap.has(d.codQuestao)) {
            dicasMap.set(d.codQuestao, []);
        }
        if (d.dica) {
            dicasMap.get(d.codQuestao)?.push(d.dica);
        }
    }

    // 4. Embaralha as QUESTÕES (objeto completo) e pega as 12 primeiras.
    // A ordem deste array é a ordem das RODADAS.
    const questoesSelecionadas = embaralhar(questoesValidas).slice(0, 12);

    // 5. Embaralha OUTRA VEZ, só para montar a lista de opções.
    // Sem este segundo embaralhamento a Nª opção da lista era sempre a resposta
    // da Nª rodada: bastava clicar na primeira opção ainda habilitada para acertar.
    const opcoesEmbaralhadas = embaralhar(questoesSelecionadas);

    // 6. Monta o objeto para o Front-end
    const listaOpcoesLimitada = opcoesEmbaralhadas.map((q: questao) => {
        return {
            nome: q.resposta!,

            // Usa o símbolo do banco. Se for null, põe '?'
            simbolo: q.simbolo || '?',

            // Mapeia 'imagemUrl' do banco para 'imgUrl' do front
            // O front vai receber "/uploads/..." ou "/img/elementos/..." direto do banco
            imgUrl: q.imagemUrl,

            // Passa a nova coluna de distribuição
            imgDistribuicao: q.imgDistribuicao
        };
    });

    // 7. Monta as rodadas usando as mesmas questões selecionadas
    const rodadasFormatadas = questoesSelecionadas.map((q: questao) => ({
        nomeElemento: q.resposta!,
        posicaoElemento: q.resposta!,
        dicas: dicasMap.get(q.codQuestao) || []
    }));

    return {
        listaOpcoes: listaOpcoesLimitada,
        rodadas: rodadasFormatadas
    };
};

// --- RANKING ---
type NivelEnum = 'INICIANTE' | 'CURIOSO' | 'CIENTISTA';

interface PontuacaoData {
    usuario: string;
    pontuacao: number;
    nivel: NivelEnum;
}

export const submitPontuacao = async (data: PontuacaoData) => {
    if (!data.usuario || data.pontuacao == null || !data.nivel) {
        throw new Error("Dados incompletos.");
    }

    return await prisma.ranking.create({
        data: {
            usuario: data.usuario,
            pontuacao: data.pontuacao,
            nivel: data.nivel,
            data_hora: new Date(),
        },
    });
};