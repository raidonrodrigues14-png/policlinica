// =============================================================
// POLICLÍNICA MUNICIPAL — API REST
// Stack: Node.js + TypeScript + Express + PostgreSQL (pg)
// Auth: JWT + Refresh Token + RBAC por perfil
// =============================================================

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

// ─── Config ──────────────────────────────────────────────────
const PORT      = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES = '8h'
const REFRESH_EXPIRES = '7d'

// ─── Database Pool ────────────────────────────────────────────
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
})

// ─── S3 / MinIO para uploads ──────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ─── App ──────────────────────────────────────────────────────
const app = express()

app.use(helmet())
app.use(compression())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting global
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true }))

// Rate limiting mais restrito para auth
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })

// =============================================================
// TIPOS
// =============================================================

type Perfil = 'admin' | 'gestor' | 'medico' | 'enfermeiro' | 'recepcionista' | 'tecnico_enfermagem'

interface JwtPayload {
  sub: string       // usuario_id
  perfil: Perfil
  nome: string
  especialidade?: string
  iat: number
  exp: number
}

interface AuthRequest extends Request {
  user?: JwtPayload
}

// =============================================================
// MIDDLEWARES
// =============================================================

// ─── Verificação JWT ──────────────────────────────────────────
const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' })
  }
  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, JWT_SECRET) as JwtPayload

    // Log de acesso (fire-and-forget)
    db.query(
      `INSERT INTO logs_acesso (usuario_id, acao, recurso, ip, status)
       VALUES ($1, 'api_request', $2, $3, 200)`,
      [req.user.sub, `${req.method} ${req.path}`, req.ip]
    ).catch(() => {})

    next()
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

// ─── RBAC — controle por perfil ───────────────────────────────
const permitir = (...perfis: Perfil[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ erro: 'Não autenticado' })
    if (!perfis.includes(req.user.perfil)) {
      return res.status(403).json({ erro: 'Acesso não autorizado para este perfil' })
    }
    next()
  }

// ─── Validação Zod ────────────────────────────────────────────
const validar = (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(422).json({
        erro: 'Dados inválidos',
        detalhes: result.error.flatten().fieldErrors,
      })
    }
    req.body = result.data
    next()
  }

// ─── Upload multer (memória → S3) ─────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    cb(null, allowed.includes(file.mimetype))
  },
})

// =============================================================
// SCHEMAS DE VALIDAÇÃO (Zod)
// =============================================================

const loginSchema = z.object({
  login: z.string().min(5),
  senha: z.string().min(6),
  perfil: z.enum(['admin','gestor','medico','enfermeiro','recepcionista','tecnico_enfermagem']),
})

const pacienteSchema = z.object({
  nome: z.string().min(3).max(120),
  cpf: z.string().length(11).regex(/^\d+$/).optional(),
  cns: z.string().length(15).optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sexo: z.enum(['M','F','I']),
  nome_mae: z.string().optional(),
  cep: z.string().length(8).optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().min(2),
  uf: z.string().length(2).default('MA'),
  telefone1: z.string().optional(),
  telefone2: z.string().optional(),
  email: z.string().email().optional(),
})

const trigemSchema = z.object({
  ficha_id: z.string().uuid(),
  peso: z.number().min(1).max(300).optional(),
  altura: z.number().min(30).max(250).optional(),
  pa_sistolica: z.number().min(40).max(300).optional(),
  pa_diastolica: z.number().min(20).max(200).optional(),
  temperatura: z.number().min(30).max(45).optional(),
  freq_cardiaca: z.number().min(20).max(300).optional(),
  freq_respirat: z.number().min(4).max(60).optional(),
  saturacao: z.number().min(50).max(100).optional(),
  glicemia: z.number().min(10).max(600).optional(),
  escala_dor: z.number().min(0).max(10).optional(),
  risco_manchester: z.enum(['vermelho','laranja','amarelo','verde','azul']).optional(),
  queixa_principal: z.string().optional(),
  inicio_sintomas: z.string().optional(),
  alergias: z.string().optional(),
  medicamentos_uso: z.string().optional(),
  obs_enfermagem: z.string().optional(),
  procedimentos: z.string().optional(),
})

const prontuarioSchema = z.object({
  ficha_id: z.string().uuid(),
  queixa_principal: z.string().optional(),
  hda: z.string().optional(),
  antec_pessoais: z.string().optional(),
  antec_familiares: z.string().optional(),
  habitos_vida: z.string().optional(),
  alergias: z.string().optional(),
  medicamentos_uso: z.string().optional(),
  estado_geral: z.string().optional(),
  aparelho_cardio: z.string().optional(),
  aparelho_resp: z.string().optional(),
  abdome: z.string().optional(),
  neurologico: z.string().optional(),
  extremidades: z.string().optional(),
  outros_sistemas: z.string().optional(),
  tratamento: z.string().optional(),
  orientacoes: z.string().optional(),
  retorno: z.string().optional(),
  procedimentos: z.string().optional(),
  tipo_atendimento: z.string().optional(),
  rascunho: z.boolean().default(true),
})

const receituarioSchema = z.object({
  prontuario_id: z.string().uuid(),
  tipo: z.enum(['simples','controle_especial','uso_continuo']).default('simples'),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    ordem: z.number().int().min(1),
    medicamento: z.string().min(1),
    dosagem: z.string().optional(),
    posologia: z.string().optional(),
    duracao: z.string().optional(),
    via_admin: z.string().optional(),
  })).min(1),
})

const atestadoSchema = z.object({
  prontuario_id: z.string().uuid().optional(),
  paciente_id: z.string().uuid(),
  dias_afasto: z.number().int().min(1),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cid: z.string().optional(),
  exibir_cid: z.boolean().default(false),
})

const agendamentoSchema = z.object({
  paciente_id: z.string().uuid(),
  medico_id: z.string().uuid(),
  especialidade: z.string().min(3),
  data_hora: z.string().datetime(),
  consultorio: z.string().optional(),
  tipo: z.string().default('consulta'),
  prioridade: z.string().default('normal'),
  obs_agendamento: z.string().optional(),
})

// =============================================================
// ROTAS
// =============================================================

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', message: 'DB unavailable' })
  }
})

// =============================================================
// AUTH
// =============================================================

// POST /api/auth/login
app.post('/api/auth/login', authLimiter, validar(loginSchema), async (req, res) => {
  const { login, senha } = req.body
  try {
    const { rows } = await db.query(
      `SELECT id, nome, cpf, email, senha_hash, perfil, especialidade, crm, ativo
       FROM usuarios
       WHERE (cpf = $1 OR email = $1) AND ativo = TRUE
       LIMIT 1`,
      [login.replace(/\D/g, '').length === 11 ? login.replace(/\D/g, '') : login]
    )
    const user = rows[0]
    if (!user) return res.status(401).json({ erro: 'Credenciais inválidas' })

    const ok = await bcrypt.compare(senha, user.senha_hash)
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' })

    const payload: Omit<JwtPayload,'iat'|'exp'> = {
      sub: user.id,
      perfil: user.perfil,
      nome: user.nome,
      especialidade: user.especialidade,
    }

    const accessToken  = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
    const refreshToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES })

    // Salvar sessão
    const tokenHash = createHash('sha256').update(accessToken).digest('hex')
    await db.query(
      `INSERT INTO sessoes (usuario_id, token_hash, ip, user_agent, expira_em)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '8 hours')`,
      [user.id, tokenHash, req.ip, req.headers['user-agent']]
    )

    res.json({
      accessToken,
      refreshToken,
      usuario: { id: user.id, nome: user.nome, perfil: user.perfil, especialidade: user.especialidade, crm: user.crm },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ erro: 'Erro interno' })
  }
})

// POST /api/auth/logout
app.post('/api/auth/logout', auth, async (req: AuthRequest, res) => {
  const token = req.headers.authorization!.slice(7)
  const hash  = createHash('sha256').update(token).digest('hex')
  await db.query(`UPDATE sessoes SET encerrado_em = NOW() WHERE token_hash = $1`, [hash])
  res.json({ ok: true })
})

// POST /api/auth/refresh
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ erro: 'Token ausente' })
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET) as { sub: string }
    const { rows } = await db.query(`SELECT * FROM usuarios WHERE id = $1 AND ativo = TRUE`, [payload.sub])
    if (!rows[0]) return res.status(401).json({ erro: 'Usuário inativo' })
    const u = rows[0]
    const accessToken = jwt.sign({ sub: u.id, perfil: u.perfil, nome: u.nome, especialidade: u.especialidade }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
    res.json({ accessToken })
  } catch {
    res.status(401).json({ erro: 'Refresh token inválido' })
  }
})

// =============================================================
// PACIENTES
// =============================================================

// GET /api/pacientes?q=&cpf=&cns=&page=&limit=
app.get('/api/pacientes', auth, permitir('admin','gestor','medico','enfermeiro','recepcionista'), async (req, res) => {
  const { q, cpf, cns, page = '1', limit = '20' } = req.query as Record<string, string>
  const offset = (parseInt(page) - 1) * parseInt(limit)
  try {
    let where = 'WHERE p.ativo = TRUE'
    const params: any[] = []
    let i = 1
    if (cpf)  { where += ` AND p.cpf = $${i++}`;  params.push(cpf.replace(/\D/g,'')) }
    if (cns)  { where += ` AND p.cns = $${i++}`;  params.push(cns.replace(/\s/g,'')) }
    if (q)    { where += ` AND p.nome ILIKE $${i++}`; params.push(`%${q}%`) }
    const { rows } = await db.query(
      `SELECT p.*, EXTRACT(YEAR FROM AGE(p.data_nascimento)) AS idade
       FROM pacientes p ${where}
       ORDER BY p.nome
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, parseInt(limit), offset]
    )
    const { rows: total } = await db.query(`SELECT COUNT(*) FROM pacientes p ${where}`, params.slice(0, i-3))
    res.json({ data: rows, total: parseInt(total[0].count), page: parseInt(page), limit: parseInt(limit) })
  } catch (e) { console.error(e); res.status(500).json({ erro: 'Erro interno' }) }
})

// GET /api/pacientes/:id
app.get('/api/pacientes/:id', auth, async (req: AuthRequest, res) => {
  const { rows } = await db.query(
    `SELECT p.*, EXTRACT(YEAR FROM AGE(p.data_nascimento)) AS idade FROM pacientes p WHERE p.id = $1`,
    [req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ erro: 'Paciente não encontrado' })
  res.json(rows[0])
})

// POST /api/pacientes
app.post('/api/pacientes', auth, permitir('admin','recepcionista'), validar(pacienteSchema), async (req: AuthRequest, res) => {
  const d = req.body
  try {
    const { rows } = await db.query(
      `INSERT INTO pacientes (nome,cpf,cns,rg,data_nascimento,sexo,nome_mae,
        cep,logradouro,numero,complemento,bairro,municipio,uf,telefone1,telefone2,email,criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [d.nome,d.cpf,d.cns,d.rg,d.data_nascimento,d.sexo,d.nome_mae,
       d.cep,d.logradouro,d.numero,d.complemento,d.bairro,d.municipio,d.uf,d.telefone1,d.telefone2,d.email,
       req.user!.sub]
    )
    res.status(201).json(rows[0])
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ erro: 'CPF ou CNS já cadastrado' })
    console.error(e); res.status(500).json({ erro: 'Erro interno' })
  }
})

// PUT /api/pacientes/:id
app.put('/api/pacientes/:id', auth, permitir('admin','recepcionista'), validar(pacienteSchema), async (req, res) => {
  const d = req.body
  const { rows } = await db.query(
    `UPDATE pacientes SET nome=$1,cpf=$2,cns=$3,data_nascimento=$4,sexo=$5,
      municipio=$6,uf=$7,telefone1=$8,telefone2=$9,email=$10
     WHERE id=$11 RETURNING *`,
    [d.nome,d.cpf,d.cns,d.data_nascimento,d.sexo,d.municipio,d.uf,d.telefone1,d.telefone2,d.email,req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ erro: 'Paciente não encontrado' })
  res.json(rows[0])
})

// =============================================================
// AGENDAMENTOS
// =============================================================

// GET /api/agendamentos?data=&medico_id=&status=
app.get('/api/agendamentos', auth, async (req, res) => {
  const { data, medico_id, status, paciente_id } = req.query as Record<string,string>
  let where = 'WHERE 1=1'
  const params: any[] = []
  let i = 1
  if (data)        { where += ` AND a.data_hora::DATE = $${i++}`; params.push(data) }
  if (medico_id)   { where += ` AND a.medico_id = $${i++}`;       params.push(medico_id) }
  if (status)      { where += ` AND a.status = $${i++}`;          params.push(status) }
  if (paciente_id) { where += ` AND a.paciente_id = $${i++}`;     params.push(paciente_id) }
  const { rows } = await db.query(
    `SELECT a.*, p.nome AS paciente_nome, p.cpf, p.cns,
            u.nome AS medico_nome, u.especialidade
     FROM agendamentos a
     JOIN pacientes p ON p.id = a.paciente_id
     JOIN usuarios u ON u.id = a.medico_id
     ${where} ORDER BY a.data_hora`,
    params
  )
  res.json(rows)
})

// POST /api/agendamentos
app.post('/api/agendamentos', auth, permitir('admin','recepcionista'), validar(agendamentoSchema), async (req: AuthRequest, res) => {
  const d = req.body
  // Verificar conflito de horário
  const { rows: conflito } = await db.query(
    `SELECT id FROM agendamentos
     WHERE medico_id = $1 AND data_hora = $2 AND status NOT IN ('cancelado','ausente')`,
    [d.medico_id, d.data_hora]
  )
  if (conflito.length) return res.status(409).json({ erro: 'Horário já ocupado para este profissional' })
  const { rows } = await db.query(
    `INSERT INTO agendamentos (paciente_id,medico_id,especialidade,data_hora,consultorio,tipo,prioridade,obs_agendamento,criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [d.paciente_id,d.medico_id,d.especialidade,d.data_hora,d.consultorio,d.tipo,d.prioridade,d.obs_agendamento,req.user!.sub]
  )
  res.status(201).json(rows[0])
})

// PATCH /api/agendamentos/:id/status
app.patch('/api/agendamentos/:id/status', auth, async (req, res) => {
  const { status } = req.body
  const { rows } = await db.query(
    `UPDATE agendamentos SET status=$1 WHERE id=$2 RETURNING *`,
    [status, req.params.id]
  )
  res.json(rows[0])
})

// =============================================================
// FICHAS DE ATENDIMENTO
// =============================================================

// GET /api/fichas?data=&status=&medico_id=
app.get('/api/fichas', auth, async (req, res) => {
  const { data = new Date().toISOString().slice(0,10), status, medico_id } = req.query as Record<string,string>
  let where = `WHERE f.data_atendimento = $1`
  const params: any[] = [data]
  let i = 2
  if (status)    { where += ` AND f.status = $${i++}`;     params.push(status) }
  if (medico_id) { where += ` AND f.medico_id = $${i++}`;  params.push(medico_id) }
  const { rows } = await db.query(
    `SELECT f.*, p.nome AS paciente_nome, p.cpf, p.data_nascimento,
            u.nome AS medico_nome, u.especialidade,
            t.risco_manchester, t.queixa_principal
     FROM fichas_atendimento f
     JOIN pacientes p ON p.id = f.paciente_id
     LEFT JOIN usuarios u ON u.id = f.medico_id
     LEFT JOIN triagens t ON t.ficha_id = f.id
     ${where} ORDER BY f.numero_ficha`,
    params
  )
  res.json(rows)
})

// POST /api/fichas — criar ficha (recepção)
app.post('/api/fichas', auth, permitir('admin','recepcionista'), async (req: AuthRequest, res) => {
  const { agendamento_id, paciente_id, medico_id, especialidade, consultorio } = req.body
  const { rows } = await db.query(
    `INSERT INTO fichas_atendimento (agendamento_id,paciente_id,medico_id,especialidade,consultorio,criado_por)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [agendamento_id, paciente_id, medico_id, especialidade, consultorio, req.user!.sub]
  )
  res.status(201).json(rows[0])
})

// PATCH /api/fichas/:id/status
app.patch('/api/fichas/:id/status', auth, async (req, res) => {
  const { status } = req.body
  const horarios: Record<string,string> = {
    em_triagem: 'hora_triagem',
    aguardando_medico: 'hora_chamada',
    em_atendimento: 'hora_inicio',
    finalizado: 'hora_fim',
  }
  const campo = horarios[status]
  const { rows } = await db.query(
    `UPDATE fichas_atendimento SET status=$1 ${campo ? `, ${campo}=NOW()` : ''}
     WHERE id=$2 RETURNING *`,
    [status, req.params.id]
  )
  res.json(rows[0])
})

// =============================================================
// TRIAGEM
// =============================================================

// POST /api/triagens
app.post('/api/triagens', auth, permitir('admin','enfermeiro','tecnico_enfermagem'), validar(trigemSchema), async (req: AuthRequest, res) => {
  const d = req.body
  // Buscar paciente_id pela ficha
  const { rows: ficha } = await db.query(`SELECT paciente_id FROM fichas_atendimento WHERE id=$1`, [d.ficha_id])
  if (!ficha[0]) return res.status(404).json({ erro: 'Ficha não encontrada' })
  const { rows } = await db.query(
    `INSERT INTO triagens (ficha_id,paciente_id,enfermeiro_id,peso,altura,pa_sistolica,pa_diastolica,
      temperatura,freq_cardiaca,freq_respirat,saturacao,glicemia,escala_dor,risco_manchester,
      queixa_principal,inicio_sintomas,alergias,medicamentos_uso,obs_enfermagem,procedimentos)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`,
    [d.ficha_id, ficha[0].paciente_id, req.user!.sub,
     d.peso,d.altura,d.pa_sistolica,d.pa_diastolica,d.temperatura,d.freq_cardiaca,
     d.freq_respirat,d.saturacao,d.glicemia,d.escala_dor,d.risco_manchester,
     d.queixa_principal,d.inicio_sintomas,d.alergias,d.medicamentos_uso,d.obs_enfermagem,d.procedimentos]
  )
  // Atualizar status da ficha
  await db.query(`UPDATE fichas_atendimento SET status='aguardando_medico', hora_triagem=NOW() WHERE id=$1`, [d.ficha_id])
  res.status(201).json(rows[0])
})

// GET /api/triagens/ficha/:ficha_id
app.get('/api/triagens/ficha/:ficha_id', auth, async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM triagens WHERE ficha_id=$1 ORDER BY criado_em DESC LIMIT 1`, [req.params.ficha_id])
  if (!rows[0]) return res.status(404).json({ erro: 'Triagem não encontrada' })
  res.json(rows[0])
})

// =============================================================
// PRONTUÁRIOS
// =============================================================

// GET /api/prontuarios/paciente/:paciente_id — histórico completo
app.get('/api/prontuarios/paciente/:paciente_id', auth, permitir('admin','medico'), async (req, res) => {
  const { rows } = await db.query(
    `SELECT pr.*, f.data_atendimento, f.especialidade, f.consultorio,
            u.nome AS medico_nome, u.crm, u.especialidade AS medico_especialidade,
            json_agg(DISTINCT d.*) FILTER (WHERE d.id IS NOT NULL) AS diagnosticos
     FROM prontuarios pr
     JOIN fichas_atendimento f ON f.id = pr.ficha_id
     JOIN usuarios u ON u.id = pr.medico_id
     LEFT JOIN diagnosticos d ON d.prontuario_id = pr.id
     WHERE pr.paciente_id = $1
     GROUP BY pr.id, f.data_atendimento, f.especialidade, f.consultorio, u.nome, u.crm, u.especialidade
     ORDER BY f.data_atendimento DESC`,
    [req.params.paciente_id]
  )
  res.json(rows)
})

// GET /api/prontuarios/:id — prontuário completo com todas as abas
app.get('/api/prontuarios/:id', auth, permitir('admin','medico'), async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM prontuarios WHERE id=$1`, [req.params.id])
  if (!rows[0]) return res.status(404).json({ erro: 'Prontuário não encontrado' })
  const [diagnosticos, encaminhamentos, receituarios, exames] = await Promise.all([
    db.query(`SELECT * FROM diagnosticos WHERE prontuario_id=$1 ORDER BY tipo, criado_em`, [req.params.id]),
    db.query(`SELECT * FROM encaminhamentos WHERE prontuario_id=$1 ORDER BY criado_em DESC`, [req.params.id]),
    db.query(`SELECT r.*, json_agg(i.* ORDER BY i.ordem) AS itens FROM receituarios r LEFT JOIN receituario_itens i ON i.receituario_id=r.id WHERE r.prontuario_id=$1 GROUP BY r.id`, [req.params.id]),
    db.query(`SELECT * FROM resultados_exames WHERE prontuario_id=$1 ORDER BY data_exame DESC`, [req.params.id]),
  ])
  res.json({
    ...rows[0],
    diagnosticos: diagnosticos.rows,
    encaminhamentos: encaminhamentos.rows,
    receituarios: receituarios.rows,
    exames: exames.rows,
  })
})

// POST /api/prontuarios
app.post('/api/prontuarios', auth, permitir('admin','medico'), validar(prontuarioSchema), async (req: AuthRequest, res) => {
  const d = req.body
  const { rows: ficha } = await db.query(`SELECT paciente_id FROM fichas_atendimento WHERE id=$1`, [d.ficha_id])
  if (!ficha[0]) return res.status(404).json({ erro: 'Ficha não encontrada' })
  const { rows } = await db.query(
    `INSERT INTO prontuarios (ficha_id,paciente_id,medico_id,queixa_principal,hda,antec_pessoais,
      antec_familiares,habitos_vida,alergias,medicamentos_uso,estado_geral,aparelho_cardio,
      aparelho_resp,abdome,neurologico,extremidades,outros_sistemas,tratamento,orientacoes,
      retorno,procedimentos,tipo_atendimento,rascunho)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
     RETURNING *`,
    [d.ficha_id, ficha[0].paciente_id, req.user!.sub,
     d.queixa_principal,d.hda,d.antec_pessoais,d.antec_familiares,d.habitos_vida,
     d.alergias,d.medicamentos_uso,d.estado_geral,d.aparelho_cardio,d.aparelho_resp,
     d.abdome,d.neurologico,d.extremidades,d.outros_sistemas,d.tratamento,d.orientacoes,
     d.retorno,d.procedimentos,d.tipo_atendimento,d.rascunho]
  )
  res.status(201).json(rows[0])
})

// PUT /api/prontuarios/:id
app.put('/api/prontuarios/:id', auth, permitir('admin','medico'), async (req: AuthRequest, res) => {
  const d = req.body
  const { rows } = await db.query(
    `UPDATE prontuarios SET queixa_principal=$1,hda=$2,antec_pessoais=$3,antec_familiares=$4,
      habitos_vida=$5,alergias=$6,medicamentos_uso=$7,estado_geral=$8,aparelho_cardio=$9,
      aparelho_resp=$10,abdome=$11,neurologico=$12,extremidades=$13,outros_sistemas=$14,
      tratamento=$15,orientacoes=$16,retorno=$17,procedimentos=$18,rascunho=$19
     WHERE id=$20 AND medico_id=$21 RETURNING *`,
    [d.queixa_principal,d.hda,d.antec_pessoais,d.antec_familiares,d.habitos_vida,
     d.alergias,d.medicamentos_uso,d.estado_geral,d.aparelho_cardio,d.aparelho_resp,
     d.abdome,d.neurologico,d.extremidades,d.outros_sistemas,d.tratamento,d.orientacoes,
     d.retorno,d.procedimentos,d.rascunho,
     req.params.id, req.user!.sub]
  )
  if (!rows[0]) return res.status(403).json({ erro: 'Não autorizado' })
  res.json(rows[0])
})

// POST /api/prontuarios/:id/assinar — finalizar prontuário
app.post('/api/prontuarios/:id/assinar', auth, permitir('medico'), async (req: AuthRequest, res) => {
  const hash = randomBytes(32).toString('hex')
  const { rows } = await db.query(
    `UPDATE prontuarios SET rascunho=FALSE, assinado_em=NOW(), assinatura_hash=$1
     WHERE id=$2 AND medico_id=$3 RETURNING *`,
    [hash, req.params.id, req.user!.sub]
  )
  if (!rows[0]) return res.status(403).json({ erro: 'Não autorizado' })
  res.json(rows[0])
})

// POST /api/prontuarios/:id/diagnosticos
app.post('/api/prontuarios/:id/diagnosticos', auth, permitir('admin','medico'), async (req, res) => {
  const { codigo_cid, descricao, tipo } = req.body
  const { rows } = await db.query(
    `INSERT INTO diagnosticos (prontuario_id,codigo_cid,descricao,tipo)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, codigo_cid, descricao, tipo || 'principal']
  )
  res.status(201).json(rows[0])
})

// DELETE /api/prontuarios/:id/diagnosticos/:diag_id
app.delete('/api/prontuarios/:id/diagnosticos/:diag_id', auth, permitir('admin','medico'), async (req, res) => {
  await db.query(`DELETE FROM diagnosticos WHERE id=$1 AND prontuario_id=$2`, [req.params.diag_id, req.params.id])
  res.json({ ok: true })
})

// =============================================================
// DOCUMENTOS — RECEITUÁRIO
// =============================================================

app.post('/api/receituarios', auth, permitir('admin','medico'), validar(receituarioSchema), async (req: AuthRequest, res) => {
  const d = req.body
  const { rows: pr } = await db.query(`SELECT paciente_id FROM prontuarios WHERE id=$1`, [d.prontuario_id])
  if (!pr[0]) return res.status(404).json({ erro: 'Prontuário não encontrado' })
  const hash = randomBytes(16).toString('hex')
  const { rows } = await db.query(
    `INSERT INTO receituarios (prontuario_id,paciente_id,medico_id,tipo,observacoes,hash_validacao)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [d.prontuario_id, pr[0].paciente_id, req.user!.sub, d.tipo, d.observacoes, hash]
  )
  const rec = rows[0]
  // Inserir itens
  await Promise.all(d.itens.map((item: any) =>
    db.query(
      `INSERT INTO receituario_itens (receituario_id,ordem,medicamento,dosagem,posologia,duracao,via_admin)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [rec.id, item.ordem, item.medicamento, item.dosagem, item.posologia, item.duracao, item.via_admin]
    )
  ))
  res.status(201).json({ ...rec, itens: d.itens })
})

// =============================================================
// DOCUMENTOS — ATESTADO
// =============================================================

app.post('/api/atestados', auth, permitir('admin','medico'), validar(atestadoSchema), async (req: AuthRequest, res) => {
  const d = req.body
  const hash = randomBytes(16).toString('hex')
  const { rows } = await db.query(
    `INSERT INTO atestados (prontuario_id,paciente_id,medico_id,dias_afasto,data_inicio,cid,exibir_cid,hash_validacao)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [d.prontuario_id||null, d.paciente_id, req.user!.sub, d.dias_afasto, d.data_inicio, d.cid||null, d.exibir_cid, hash]
  )
  res.status(201).json(rows[0])
})

// =============================================================
// UPLOAD DE EXAMES
// =============================================================

// POST /api/exames/upload
app.post('/api/exames/upload', auth, permitir('admin','medico'), upload.single('arquivo'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Arquivo não enviado' })
  
  const { paciente_id, prontuario_id, tipo, descricao, data_exame } = req.body
  
  // Gerar caminho único para o arquivo
  const filePath = `${paciente_id}/${Date.now()}-${req.file.originalname}`
  
  // Upload para Supabase Storage
  const { data, error } = await supabase.storage
    .from('exames')
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) {
    console.error('Erro no upload:', error)
    return res.status(500).json({ erro: 'Falha ao fazer upload do arquivo' })
  }
  
  // Obter URL pública do arquivo
  const { data: { publicUrl } } = supabase.storage
    .from('exames')
    .getPublicUrl(data.path)
  
  // Salvar referência no banco de dados
  const { rows } = await db.query(
    `INSERT INTO resultados_exames (paciente_id, prontuario_id, tipo, descricao, data_exame, arquivo_url, arquivo_nome, tamanho_bytes, enviado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [paciente_id, prontuario_id || null, tipo, descricao, data_exame || null, publicUrl, req.file.originalname, req.file.size, req.user!.sub]
  )
  
  res.status(201).json(rows[0])
})

// =============================================================
// APAC
// =============================================================

app.get('/api/apacs', auth, permitir('admin','gestor','medico'), async (req, res) => {
  const { status, paciente_id } = req.query as Record<string,string>
  let where = 'WHERE 1=1'
  const params: any[] = []
  let i = 1
  if (status)      { where += ` AND a.status = $${i++}`;      params.push(status) }
  if (paciente_id) { where += ` AND a.paciente_id = $${i++}`; params.push(paciente_id) }
  const { rows } = await db.query(
    `SELECT a.*, p.nome AS paciente_nome, u.nome AS medico_nome
     FROM apacs a JOIN pacientes p ON p.id=a.paciente_id JOIN usuarios u ON u.id=a.medico_id
     ${where} ORDER BY a.criado_em DESC`,
    params
  )
  res.json(rows)
})

app.post('/api/apacs', auth, permitir('admin','medico','gestor'), async (req: AuthRequest, res) => {
  const d = req.body
  const numero = `${String(Date.now()).slice(-6)}/${new Date().getFullYear().toString().slice(-2)}`
  const { rows } = await db.query(
    `INSERT INTO apacs (numero_apac,paciente_id,medico_id,codigo_procedimento,descricao_proc,cid_principal,quantidade,competencia,validade,justificativa)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [numero,d.paciente_id,req.user!.sub,d.codigo_procedimento,d.descricao_proc,d.cid_principal,d.quantidade||1,d.competencia,d.validade,d.justificativa]
  )
  res.status(201).json(rows[0])
})

// =============================================================
// RELATÓRIOS (apenas gestor/admin)
// =============================================================

// GET /api/relatorios/producao?mes=&ano=
app.get('/api/relatorios/producao', auth, permitir('admin','gestor'), async (req, res) => {
  const { mes = new Date().getMonth()+1, ano = new Date().getFullYear() } = req.query
  const { rows } = await db.query(
    `SELECT * FROM mv_producao_mensal
     WHERE EXTRACT(MONTH FROM competencia)=$1 AND EXTRACT(YEAR FROM competencia)=$2
     ORDER BY total_consultas DESC`,
    [mes, ano]
  )
  res.json(rows)
})

// GET /api/relatorios/absenteismo?mes=&ano=
app.get('/api/relatorios/absenteismo', auth, permitir('admin','gestor'), async (req, res) => {
  const { mes = new Date().getMonth()+1, ano = new Date().getFullYear() } = req.query
  const { rows } = await db.query(
    `SELECT m.*, u.nome AS medico_nome
     FROM mv_absenteismo_mensal m
     JOIN usuarios u ON u.id = m.medico_id
     WHERE EXTRACT(MONTH FROM m.competencia)=$1 AND EXTRACT(YEAR FROM m.competencia)=$2
     ORDER BY taxa_absenteismo_pct DESC`,
    [mes, ano]
  )
  res.json(rows)
})

// GET /api/relatorios/bpa?competencia=
app.get('/api/relatorios/bpa', auth, permitir('admin','gestor'), async (req, res) => {
  const { competencia } = req.query as Record<string,string>
  const [mes, ano] = competencia ? competencia.split('/') : [String(new Date().getMonth()+1), String(new Date().getFullYear())]
  const { rows } = await db.query(
    `SELECT u.cbo, u.especialidade, d.codigo_cid, COUNT(f.id) AS quantidade,
            TO_CHAR(f.data_atendimento, 'MM/YYYY') AS competencia
     FROM fichas_atendimento f
     JOIN usuarios u ON u.id = f.medico_id
     LEFT JOIN prontuarios pr ON pr.ficha_id = f.id
     LEFT JOIN diagnosticos d ON d.prontuario_id = pr.id AND d.tipo = 'principal'
     WHERE EXTRACT(MONTH FROM f.data_atendimento)=$1
       AND EXTRACT(YEAR FROM f.data_atendimento)=$2
       AND f.status = 'finalizado'
     GROUP BY u.cbo, u.especialidade, d.codigo_cid, TO_CHAR(f.data_atendimento,'MM/YYYY')
     ORDER BY quantidade DESC`,
    [mes, ano]
  )
  res.json(rows)
})

// GET /api/relatorios/dashboard — indicadores rápidos
app.get('/api/relatorios/dashboard', auth, permitir('admin','gestor'), async (_req, res) => {
  const hoje = new Date().toISOString().slice(0,10)
  const [consultas, espera, filas, absenteismo] = await Promise.all([
    db.query(`SELECT COUNT(*) FROM fichas_atendimento WHERE data_atendimento=$1 AND status='finalizado'`, [hoje]),
    db.query(`SELECT AVG(EXTRACT(EPOCH FROM (hora_inicio - hora_recepcao))/60) AS media_min FROM fichas_atendimento WHERE data_atendimento=$1 AND hora_inicio IS NOT NULL`, [hoje]),
    db.query(`SELECT status, COUNT(*) FROM fichas_atendimento WHERE data_atendimento=$1 GROUP BY status`, [hoje]),
    db.query(`SELECT ROUND(COUNT(*) FILTER(WHERE status='ausente')::NUMERIC/NULLIF(COUNT(*),0)*100,1) AS pct FROM fichas_atendimento WHERE data_atendimento=$1`, [hoje]),
  ])
  res.json({
    consultas_hoje: parseInt(consultas.rows[0].count),
    tempo_medio_espera: parseFloat(espera.rows[0]?.media_min || '0').toFixed(0),
    por_status: filas.rows,
    absenteismo_hoje: absenteismo.rows[0]?.pct || 0,
  })
})

// =============================================================
// USUÁRIOS (admin)
// =============================================================

app.get('/api/usuarios', auth, permitir('admin','gestor'), async (_req, res) => {
  const { rows } = await db.query(
    `SELECT id,nome,cpf,email,perfil,especialidade,crm,cbo,ativo,criado_em FROM usuarios ORDER BY nome`
  )
  res.json(rows)
})

app.post('/api/usuarios', auth, permitir('admin'), async (req, res) => {
  const { nome, cpf, email, senha, perfil, especialidade, crm, cbo } = req.body
  const hash = await bcrypt.hash(senha, 12)
  try {
    const { rows } = await db.query(
      `INSERT INTO usuarios (nome,cpf,email,senha_hash,perfil,especialidade,crm,cbo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,nome,email,perfil`,
      [nome,cpf,email,hash,perfil,especialidade,crm,cbo]
    )
    res.status(201).json(rows[0])
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ erro: 'CPF ou e-mail já cadastrado' })
    throw e
  }
})

app.patch('/api/usuarios/:id/ativo', auth, permitir('admin'), async (req, res) => {
  const { ativo } = req.body
  await db.query(`UPDATE usuarios SET ativo=$1 WHERE id=$2`, [ativo, req.params.id])
  res.json({ ok: true })
})

// GET /api/cid?q= — busca CID-10
app.get('/api/cid', auth, async (req, res) => {
  const { q } = req.query as { q: string }
  // Em produção: tabela completa CID-10 importada; aqui retorna mock reduzido
  const cids = [
    { codigo:'I10',  descricao:'Hipertensão essencial (primária)' },
    { codigo:'I20.0',descricao:'Angina instável' },
    { codigo:'I21',  descricao:'Infarto agudo do miocárdio' },
    { codigo:'E11',  descricao:'Diabetes mellitus tipo 2' },
    { codigo:'E78.5',descricao:'Hiperlipidemia não especificada' },
    { codigo:'J18',  descricao:'Pneumonia não especificada' },
    { codigo:'K21.0',descricao:'Doença de refluxo gastroesofágico' },
    { codigo:'M54.5',descricao:'Dor lombar baixa' },
    { codigo:'N18.5',descricao:'Doença renal crônica estágio 5' },
    { codigo:'C50.9',descricao:'Neoplasia maligna da mama, não especificada' },
  ].filter(c => c.codigo.toLowerCase().includes(q?.toLowerCase()||'') || c.descricao.toLowerCase().includes(q?.toLowerCase()||''))
  res.json(cids)
})

// =============================================================
// VALIDAÇÃO DE DOCUMENTOS (QR Code)
// =============================================================

app.get('/api/validar/:hash', async (req, res) => {
  const { hash } = req.params
  const checks = await Promise.all([
    db.query(`SELECT 'receituario' AS tipo, r.criado_em, p.nome AS paciente, u.nome AS medico FROM receituarios r JOIN pacientes p ON p.id=r.paciente_id JOIN usuarios u ON u.id=r.medico_id WHERE r.hash_validacao=$1`, [hash]),
    db.query(`SELECT 'atestado' AS tipo, a.criado_em, p.nome AS paciente, u.nome AS medico FROM atestados a JOIN pacientes p ON p.id=a.paciente_id JOIN usuarios u ON u.id=a.medico_id WHERE a.hash_validacao=$1`, [hash]),
  ])
  const resultado = checks.flatMap(c => c.rows)[0]
  if (!resultado) return res.status(404).json({ valido: false, mensagem: 'Documento não encontrado' })
  res.json({ valido: true, ...resultado })
})

// =============================================================
// ERROR HANDLER
// =============================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message, err.stack)
  res.status(500).json({ erro: 'Erro interno do servidor' })
})

// =============================================================
// START
// =============================================================

app.listen(PORT, () => {
  console.log(`🏥 PoliclínicaMed API rodando na porta ${PORT}`)
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`)
})

export default app