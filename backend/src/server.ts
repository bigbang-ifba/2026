import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

import rankingRoutes from './routes/rankingRoutes.js';
import jogoRoutes from './routes/jogoRoutes.js';
import uploadConfig from './config/upload.js';
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
// Aceita uma lista separada por vírgula, para liberar mais de uma origem
// (ex.: localhost no PC e o IP da rede local ao testar no celular).
const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';

// O site pode ser aberto com ou sem "www." e o navegador envia a origem
// exatamente como foi digitada na barra de endereços. Para não depender de
// listar as duas formas na variável de ambiente, cada origem configurada já
// libera as duas variantes (com e sem www).
const comVariantesDeWww = (origem: string): string[] => {
    try {
        const url = new URL(origem);
        const hosts = url.hostname.startsWith('www.')
            ? [url.hostname, url.hostname.slice(4)]
            : [url.hostname, `www.${url.hostname}`];

        return hosts.map(host => {
            const variante = new URL(origem);
            variante.hostname = host;
            return variante.origin;
        });
    } catch {
        // Valor que não é uma URL válida continua sendo usado como veio.
        return [origem];
    }
};

const origensPermitidas = Array.from(new Set(
    frontendUrl
        .split(',')
        .map(origem => origem.trim())
        .filter(Boolean)
        .flatMap(comVariantesDeWww)
));

app.use(cors({
    origin: [...origensPermitidas, 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use(express.json());

// --- DEBUG DE UPLOADS (IMPORTANTE) ---
console.log('------------------------------------------------');
console.log('📂 Pasta de Uploads configurada:', uploadConfig.directory);

// Verifica se a pasta existe fisicamente
if (fs.existsSync(uploadConfig.directory)) {
    console.log('✅ A pasta de uploads existe no disco.');

    // Lista os arquivos para ter certeza que sua imagem está lá
    const files = fs.readdirSync(uploadConfig.directory);
    console.log(`📊 Total de arquivos na pasta: ${files.length}`);
    if (files.length > 0) {
        console.log('📄 Exemplo de arquivo encontrado:', files[0]);
    } else {
        console.log('⚠️ A pasta está vazia!');
    }
} else {
    console.error('❌ ERRO CRÍTICO: A pasta de uploads NÃO existe nesse caminho!');
    // Tenta criar a pasta para evitar erro futuro
    fs.mkdirSync(uploadConfig.directory, { recursive: true });
    console.log('🛠️ Pasta de uploads criada automaticamente.');
}
console.log('------------------------------------------------');

// Servir arquivos estáticos
app.use('/uploads', express.static(uploadConfig.directory));

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'BigBang API está online!',
        cors_allowed: origensPermitidas
    });
});

// O proxy do Coolify remove o prefixo /api antes de repassar a requisição ao
// container, então as rotas são montadas nos dois caminhos: com e sem o prefixo.
const apiRoutes = express.Router();

apiRoutes.use('/ranking', rankingRoutes);
apiRoutes.use('/jogo', jogoRoutes);
apiRoutes.use(adminRoutes);

app.use('/api', apiRoutes);
app.use(apiRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});