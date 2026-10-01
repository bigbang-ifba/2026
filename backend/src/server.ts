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
const origensPermitidas = frontendUrl
    .split(',')
    .map(origem => origem.trim())
    .filter(Boolean);

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
        cors_allowed: frontendUrl
    });
});

app.use('/api/ranking', rankingRoutes);
app.use('/api/jogo', jogoRoutes);
app.use('/api', adminRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});