import { Router } from 'express';
import multer from 'multer';
import uploadConfig from '../config/upload.js';
import * as ElementoController from '../controllers/elemento/elementoController.js';
import * as ParticipanteController from '../controllers/participante/participanteController.js';
import * as AuthController from '../controllers/auth/authController.js';
import * as UsuarioController from '../controllers/usuario/usuarioController.js';
import { authMiddleware } from '../middlewares/auth/authMiddleware.js';

const router = Router();
const upload = multer(uploadConfig);

// --- CONFIGURAÇÃO DE UPLOAD MÚLTIPLO ---
const uploadCampos = upload.fields([
    { name: 'imagem', maxCount: 1 },
    { name: 'imagemDistribuicao', maxCount: 1 }
]);

router.post('/login', AuthController.login);
router.post('/registrar', AuthController.registrar);

router.use(authMiddleware);

// --- Elementos ---
router.get('/elementos', ElementoController.listar);
router.get('/elementos/:id', ElementoController.buscarPorId);

router.post('/elementos', uploadCampos, ElementoController.criar);
router.put('/elementos/:id', uploadCampos, ElementoController.atualizar);

router.delete('/elementos/:id', ElementoController.deletar);

// --- Participantes ---
router.get('/participantes', ParticipanteController.listar);
router.delete('/participantes', ParticipanteController.deletarVarios);
router.delete('/participantes/:id', ParticipanteController.deletar);
router.put('/participantes/:id', ParticipanteController.atualizar);

// --- USUÁRIOS (ADMINS) ---
router.get('/usuarios', UsuarioController.listar);
router.get('/usuarios/:id', UsuarioController.buscarPorId);
router.post('/usuarios', UsuarioController.criar);
router.put('/usuarios/:id', UsuarioController.atualizar);
router.delete('/usuarios/:id', UsuarioController.deletar);

export default router;