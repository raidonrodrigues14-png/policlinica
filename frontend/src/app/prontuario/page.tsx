'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// CID-10 base (expandível)
const CID10: Record<string,string> = {
  'A00':'Colera','A01':'Febres tifoide e paratifoide','A02':'Outras infeccoes por Salmonella',
  'A09':'Diarreia e gastroenterite','A15':'Tuberculose respiratoria',
  'B20':'Doenca pelo HIV','B34':'Infeccao viral de localizacao nao especificada',
  'C50':'Neoplasia maligna da mama','C53':'Neoplasia maligna do colo do utero',
  'C61':'Neoplasia maligna da prostata','C80':'Neoplasia maligna sem especificacao de localizacao',
  'D50':'Anemias por deficiencia de ferro','D64':'Outras anemias',
  'E10':'Diabetes mellitus tipo 1','E11':'Diabetes mellitus tipo 2',
  'E14':'Diabetes mellitus nao especificado','E66':'Obesidade',
  'E78':'Disturbios do metabolismo de lipoproteinas',
  'F32':'Episodios depressivos','F41':'Outros transtornos ansiosos',
  'G40':'Epilepsia','G43':'Enxaqueca',
  'H10':'Conjuntivite','H52':'Disturbios da acomodacao e da refracao',
  'I10':'Hipertensao essencial','I20':'Angina pectoris','I20.0':'Angina instavel',
  'I21':'Infarto agudo do miocardio','I25':'Doenca isquemica cronica do coracao',
  'I48':'Fibrilacao e flutter atrial','I50':'Insuficiencia cardiaca',
  'J00':'Rinofaringite aguda (resfriado comum)','J06':'Infeccao aguda das vias aereas superiores',
  'J11':'Gripe','J18':'Pneumonia nao especificada',
  'J20':'Bronquite aguda','J44':'Doenca pulmonar obstrutiva cronica',
  'J45':'Asma','J46':'Estado de mal asmatico',
  'K21':'Doenca do refluxo gastroesofagico','K25':'Ulcera gastrica',
  'K29':'Gastrite e duodenite','K35':'Apendicite aguda',
  'K57':'Doenca diverticular do intestino','K80':'Colelitíase',
  'L20':'Dermatite atopica','L30':'Outras dermatites',
  'M10':'Gota','M17':'Gonartrose','M54':'Dorsalgia','M54.5':'Dor lombar baixa',
  'N18':'Doenca renal cronica','N18.5':'Doenca renal cronica estagio 5',
  'N20':'Calculo do rim e do ureter','N39':'Outros disturbios do aparelho urinario',
  'N94':'Dores e outras afeccoes associadas aos orgaos genitais femininos',
  'O00':'Gravidez ectopica','O24':'Diabetes mellitus na gravidez',
  'O80':'Parto unico espontaneo','O82':'Parto por cesarea',
  'R00':'Anormalidades do batimento cardiaco','R05':'Tosse',
  'R06':'Anormalidades da respiracao','R07':'Dor de garganta e no peito',
  'R10':'Dor abdominal e pelvica','R51':'Cefaleia',
  'R52':'Dor nao classificada em outra parte','R73':'Glicemia elevada',
  'S06':'Traumatismo intracraniano','S72':'Fratura do femur',
  'T14':'Traumatismo de regiao nao especificada do corpo',
  'Z00':'Exame geral','Z13':'Rastreamento de outras doencas',
  'Z23':'Necessidade de imunizacao','Z34':'Supervisao de gravidez normal',
}

function buscarCID(q: string) {
  if (!q || q.length < 2) return []
  const ql = q.toLowerCase()
  return Object.entries(CID10).filter(([cod, desc]) =>
    cod.toLowerCase().includes(ql) || desc.toLowerCase().includes(ql)
  ).slice(0, 8)
}

const VITAIS = [
  { k:'pas',  l:'PA Sistolica',   u:'mmHg', min:40,  max:300, ok:120,  at:139 },
  { k:'pad',  l:'PA Diastolica',  u:'mmHg', min:20,  max:200, ok:80,   at:89  },
  { k:'fc',   l:'Freq. Cardiaca', u:'bpm',  min:20,  max:300, ok:100,  at:120 },
  { k:'temp', l:'Temperatura',    u:'C',    min:30,  max:45,  ok:37.2, at:38.9},
  { k:'sat',  l:'Saturacao O2',   u:'%',    min:50,  max:100, ok:95,   at:90  },
  { k:'glic', l:'Glicemia',       u:'mg/dL',min:10,  max:600, ok:99,   at:125 },
  { k:'peso', l:'Peso',           u:'kg',   min:1,   max:300, ok:0,    at:0   },
  { k:'alt',  l:'Altura',         u:'cm',   min:30,  max:250, ok:0,    at:0   },
]

function stVital(k:string, v:string) {
  const vt = VITAIS.find(x=>x.k===k)
  if (!vt || !v) return ''
  const n = parseFloat(v)
  if (k==='sat') return n>=95?'normal':n>=90?'atencao':'alerta'
  if (!vt.ok) return 'normal'
  return n<=vt.ok?'normal':n<=vt.at?'atencao':'alerta'
}

const ST:Record<string,{bg:string;c:string;t:string}> = {
  normal:  {bg:'#dcfce7',c:'#166534',t:'Normal'},
  atencao: {bg:'#fef9c3',c:'#854d0e',t:'Atencao'},
  alerta:  {bg:'#fee2e2',c:'#991b1b',t:'Alerta'},
}

const ABAS = [
  {id:'anamnese',    l:'1 Anamnese',    emoji:'📋'},
  {id:'exame',       l:'2 Exame Fisico', emoji:'🩺'},
  {id:'resultados',  l:'3 Resultados',  emoji:'📊'},
  {id:'diagnostico', l:'4 Diagnosticos',emoji:'🔍'},
  {id:'conduta',     l:'5 Conduta',     emoji:'💊'},
  {id:'encaminh',    l:'6 Encaminham.', emoji:'➡️'},
  {id:'agendamento', l:'7 Agendar Consulta', emoji:'📅'},
  {id:'registroTardio', l:'8 Registro Tardio', emoji:'⏰'},
  {id:'resultadosExames', l:'9 Resultados Exames', emoji:'🔬'},
]

type DocTipo = 'receita' | 'atestado' | 'declaracao' | 'exames' | 'encaminhamento'
interface MedItem { id:string; med:string; dose:string; pos:string; dur:string }

const UNIDADE = {
  prefeitura: 'PREFEITURA MUNICIPAL',
  secretaria: 'Secretaria Municipal de Saude',
  unidade:    'Policlinica Municipal',
  cnes:       '1234567',
  endereco:   'Av. Principal, 100 - Centro',
  municipio:  'Alto Alegre do Maranhao - MA',
  telefone:   '(99) 3333-4444',
}

// Componente de Preview do Documento
function DocPreview({ tipo, dados }: { tipo: DocTipo; dados: any }) {
  const estilos = {
    papel: { background:'#fff', border:'1px solid #d0d0d0', borderRadius:4, padding:'28px 32px',
      maxWidth:520, margin:'0 auto', fontFamily:'Arial,sans-serif', color:'#111', fontSize:13 },
    header: { borderBottom:'2px solid #1a3a6e', paddingBottom:12, marginBottom:16,
      display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
    logo: { display:'flex', alignItems:'center', gap:10 },
    logoBox: { width:40, height:40, background:'#1a3a6e', borderRadius:6,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', fontWeight:700 },
    org: { fontSize:12, fontWeight:700, color:'#1a3a6e', lineHeight:1.3 },
    orgSub: { fontSize:10, color:'#555', marginTop:2 },
    badge: { textAlign:'center' as const, background:'#f5f7fa', border:'1px solid #e0e4ea',
      borderRadius:4, padding:'8px 12px', marginBottom:16 },
    badgeTitle: { fontSize:14, fontWeight:700, color:'#1a3a6e', letterSpacing:'.04em', textTransform:'uppercase' as const },
    badgeSub: { fontSize:10, color:'#666', marginTop:2 },
    pacBox: { background:'#f5f7fa', border:'1px solid #e0e4ea', borderRadius:4,
      padding:'10px 14px', marginBottom:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
    pacField: { fontSize:10, color:'#666' },
    pacVal: { fontSize:12, fontWeight:600, color:'#111', marginTop:1 },
    secTitle: { fontSize:10, fontWeight:700, color:'#1a3a6e', letterSpacing:'.06em',
      textTransform:'uppercase' as const, margin:'12px 0 8px', borderBottom:'1px solid #e0e4ea', paddingBottom:4 },
    footer: { marginTop:28, borderTop:'1px solid #e0e4ea', paddingTop:14,
      display:'flex', justifyContent:'space-between', alignItems:'flex-end' },
    assinatura: { textAlign:'center' as const },
    linha: { width:160, borderTop:'1px solid #111', margin:'0 auto 4px' },
    dr: { fontSize:11, fontWeight:700, color:'#111' },
    crm: { fontSize:10, color:'#555' },
    valida: { fontSize:9, color:'#888', textAlign:'center' as const, marginTop:12 },
    carimbo: { width:80, height:50, border:'1px dashed #bbb', borderRadius:4,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#bbb', textAlign:'center' as const, padding:4 },
    qr: { width:44, height:44, background:'#f0f0f0', borderRadius:4,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#999', textAlign:'center' as const },
  }

  const hoje = new Date().toLocaleDateString('pt-BR')

  const Header = () => (
    <div style={estilos.header}>
      <div style={estilos.logo}>
        <div style={estilos.logoBox}>+</div>
        <div>
          <div style={estilos.org}>{UNIDADE.prefeitura}</div>
          <div style={estilos.orgSub}>{UNIDADE.secretaria}<br/>{UNIDADE.unidade}</div>
        </div>
      </div>
      <div style={estilos.qr}>QR<br/>Code</div>
    </div>
  )

  const PacienteBox = () => (
    <div style={estilos.pacBox}>
      <div><div style={estilos.pacField}>Paciente</div><div style={estilos.pacVal}>{dados.paciente || '—'}</div></div>
      <div><div style={estilos.pacField}>Data</div><div style={estilos.pacVal}>{hoje}</div></div>
      <div><div style={estilos.pacField}>CPF</div><div style={estilos.pacVal}>{dados.cpf || '—'}</div></div>
      <div><div style={estilos.pacField}>Medico</div><div style={estilos.pacVal}>{dados.medico || '—'}</div></div>
    </div>
  )

  const Rodape = () => (
    <>
      <div style={estilos.footer}>
        <div style={estilos.carimbo}>Carimbo do profissional</div>
        <div style={estilos.assinatura}>
          <div style={estilos.linha} />
          <div style={estilos.dr}>{dados.medico || 'Dr. —'}</div>
          <div style={estilos.crm}>{dados.crm || 'CRM —'}</div>
        </div>
        <div style={{ fontSize:10, color:'#555', textAlign:'right' }}>
          {UNIDADE.municipio}<br/>{hoje}
        </div>
      </div>
      <div style={estilos.valida}>Valide em: policlinica.municipio.gov.br/validar · CNES {UNIDADE.cnes}</div>
    </>
  )

  if (tipo === 'receita') return (
    <div style={estilos.papel}>
      <Header />
      <div style={estilos.badge}>
        <div style={estilos.badgeTitle}>Receituario Medico {dados.tipoRec === 'especial' ? '— Controle Especial' : dados.tipoRec === 'continuo' ? '— Uso Continuo' : ''}</div>
        <div style={estilos.badgeSub}>Valido somente com assinatura e carimbo do profissional</div>
      </div>
      <PacienteBox />
      <div style={estilos.secTitle}>Prescricao medica</div>
      {dados.itens?.filter((m:MedItem)=>m.med).map((m:MedItem, i:number) => (
        <div key={m.id} style={{ marginBottom:10, paddingLeft:12, borderLeft:'3px solid #1a3a6e' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#1a3a6e' }}>{i+1}.</div>
          <div style={{ fontSize:13, fontWeight:700, color:'#111', margin:'2px 0' }}>{m.med} {m.dose}</div>
          <div style={{ fontSize:11, color:'#333' }}>{m.pos}</div>
          <div style={{ fontSize:11, color:'#555', fontStyle:'italic' }}>{m.dur}</div>
        </div>
      ))}
      {dados.obs && <div style={{ background:'#fffef0', border:'1px solid #e8e0b0', borderRadius:4, padding:10, margin:'12px 0', fontSize:11, color:'#555' }}>{dados.obs}</div>}
      <Rodape />
    </div>
  )

  if (tipo === 'atestado') {
    const diasExt: Record<number,string> = {1:'um',2:'dois',3:'tres',4:'quatro',5:'cinco',6:'seis',7:'sete',8:'oito',9:'nove',10:'dez',15:'quinze',30:'trinta'}
    const d = parseInt(dados.dias) || 1
    return (
      <div style={estilos.papel}>
        <Header />
        <div style={estilos.badge}><div style={estilos.badgeTitle}>Atestado Medico</div><div style={estilos.badgeSub}>Documento valido para fins legais e trabalhistas</div></div>
        <div style={{ fontSize:13, lineHeight:1.85, color:'#222', margin:'16px 0' }}>
          Atesto para os devidos fins que o(a) paciente <strong>{dados.paciente || '—'}</strong>,
          portador(a) do CPF <strong>{dados.cpf || '—'}</strong>,
          encontra-se sob meus cuidados medicos, necessitando de afastamento de suas
          atividades por <strong>{d} ({diasExt[d]||d}) dia{d>1?'s':''}</strong>,
          a partir de <strong>{dados.dataInicio || hoje}</strong>
          {dados.cid && dados.exibirCid === 'sim' ? `, em razao do diagnostico ${dados.cid}` : ''}.
        </div>
        <Rodape />
      </div>
    )
  }

  if (tipo === 'declaracao') return (
    <div style={estilos.papel}>
      <Header />
      <div style={estilos.badge}><div style={estilos.badgeTitle}>Declaracao de Comparecimento</div></div>
      <div style={{ fontSize:13, lineHeight:1.85, color:'#222', margin:'16px 0' }}>
        Declaramos para os devidos fins que o(a) Sr.(a) <strong>{dados.paciente || '—'}</strong>,
        portador(a) do CPF <strong>{dados.cpf || '—'}</strong>,
        compareceu a esta unidade de saude no dia <strong>{dados.dataDoc || hoje}</strong>,
        no horario das <strong>{dados.entrada || '—'}</strong> as <strong>{dados.saida || '—'}</strong>,
        para atendimento medico ambulatorial.
      </div>
      <Rodape />
    </div>
  )

  if (tipo === 'exames') return (
    <div style={estilos.papel}>
      <Header />
      <div style={estilos.badge}><div style={estilos.badgeTitle}>Solicitacao de Exames {dados.tipoExame}</div></div>
      <PacienteBox />
      <div style={estilos.secTitle}>Exames solicitados</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px', fontSize:12, color:'#222', marginBottom:14 }}>
        {dados.exames?.filter((e:string)=>e).map((e:string,i:number)=>(
          <div key={i}>• {e}{dados.urgente?<strong style={{color:'#A32D2D'}}> (URGENTE)</strong>:null}</div>
        ))}
      </div>
      {dados.hipotese && <div style={{ fontSize:12, marginBottom:10 }}><strong>Hipotese diagnostica:</strong> {dados.hipotese}</div>}
      <Rodape />
    </div>
  )

  if (tipo === 'encaminhamento') return (
    <div style={estilos.papel}>
      <Header />
      <div style={estilos.badge}><div style={estilos.badgeTitle}>Encaminhamento Medico</div></div>
      <PacienteBox />
      <div style={estilos.secTitle}>Dados do encaminhamento</div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, marginBottom:4 }}><strong>Especialidade:</strong> {dados.especialidade || '—'}</div>
        <div style={{ fontSize:12, marginBottom:4 }}><strong>Tipo:</strong> {dados.tipoEnc || '—'}</div>
        <div style={{ fontSize:12, marginBottom:4 }}><strong>Prioridade:</strong> <span style={{ color: dados.prioridade==='Alta'?'#A32D2D':'#166534', fontWeight:700 }}>{dados.prioridade || '—'}</span></div>
      </div>
      <div style={estilos.secTitle}>Justificativa clinica</div>
      <div style={{ fontSize:12, color:'#333', lineHeight:1.6, marginBottom:14 }}>{dados.justificativa || '—'}</div>
      <Rodape />
    </div>
  )

  return null
}

export default function ProntuarioPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [aba, setAba]         = useState('anamnese')
  const [salvo, setSalvo]     = useState(false)
  
  // Modal de documentos
  const [showDocModal, setShowDocModal] = useState(false)
  const [docTipo, setDocTipo] = useState<DocTipo>('receita')
  const printRef = useRef<HTMLDivElement>(null)
  
  // Dados dos documentos
  const [docPaciente, setDocPaciente] = useState('')
  const [docCpf, setDocCpf] = useState('')
  const [docMedico, setDocMedico] = useState('')
  const [docCrm, setDocCrm] = useState('')
  
  // Receituario
  const [tipoRec, setTipoRec] = useState('simples')
  const [itens, setItens] = useState<MedItem[]>([{ id:'1', med:'', dose:'', pos:'', dur:'' }])
  const [obs, setObs] = useState('')
  
  // Atestado
  const [dias, setDias] = useState('2')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0,10))
  const [cid, setCid] = useState('')
  const [exibirCid, setExibirCid] = useState('nao')
  
  // Declaracao
  const [dataDoc, setDataDoc] = useState(new Date().toISOString().slice(0,10))
  const [entrada, setEntrada] = useState('09:00')
  const [saida, setSaida] = useState('10:30')
  
  // Exames
  const [tipoExame, setTipoExame] = useState('Laboratoriais')
  const [exames, setExames] = useState(['','','',''])
  const [hipotese, setHipotese] = useState('')
  const [urgente, setUrgente] = useState(false)
  
  // Encaminhamento
  const [especialidade, setEspec] = useState('Cardiologia')
  const [tipoEnc, setTipoEnc] = useState('Especialista')
  const [prioridade, setPriori] = useState('Alta')
  const [justificativa, setJustif] = useState('')

  // Agendamento de consulta
  const [agendamento, setAgendamento] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    sexo: 'Masculino',
    municipio: '',
    especialidade: 'Clínica Geral',
    dataAgendamento: '',
    horario: '09:00',
    profissional: '',
    observacoes: ''
  })
  const [agendamentoSucesso, setAgendamentoSucesso] = useState(false)
  const [agendamentosLista, setAgendamentosLista] = useState<any[]>([])

  // Registro Tardio
  const [registroTardio, setRegistroTardio] = useState({
    cidadao: '',
    dataAtendimento: '',
    horaAtendimento: '15:00',
    localAtendimento: 'UBS',
    justificativa: '',
    motivo: ''
  })
  const [registrosTardios, setRegistrosTardios] = useState<any[]>([])
  const [filtroRegistros, setFiltroRegistros] = useState('todos')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')

  // Resultados de Exames
  const [resultadoExame, setResultadoExame] = useState({
    exame: '',
    dataRealizacao: '',
    dataResultado: '',
    resultado: 'Normal',
    descricao: ''
  })
  const [examesRealizados, setExamesRealizados] = useState<any[]>([])

  // Fila de pacientes
  const [filaMedica, setFilaMedica] = useState<any[]>([])
  const [pacienteAtual, setPacienteAtual] = useState<any>(null)
  const [finalizado, setFinalizado] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([])
  const [novoPaciente, setNovoPaciente] = useState({
    nome: '', idade: '', sexo: 'Feminino', cpf: '', telefone: ''
  })

  // Anamnese
  const [queixa, setQueixa] = useState('')
  const [hda, setHda] = useState('')
  const [antPes, setAntPes] = useState('')
  const [antFam, setAntFam] = useState('')
  const [habitos, setHabitos] = useState('')
  const [alergias, setAlergias] = useState('')
  const [meds, setMeds] = useState('')

  // Exame fisico
  const [vitais, setVitais] = useState<Record<string,string>>({pas:'',pad:'',fc:'',temp:'',sat:'',glic:'',peso:'',alt:''})
  const [egeral, setEgeral] = useState('')
  const [cardio, setCardio] = useState('')
  const [resp, setResp] = useState('')
  const [abd, setAbd] = useState('')
  const [neuro, setNeuro] = useState('')
  const [ext, setExt] = useState('')

  // Diagnosticos
  const [cids, setCids] = useState<any[]>([])
  const [cidBusca, setCidBusca] = useState('')
  const [cidResultados, setCidResult] = useState<[string,string][]>([])
  const [cidTipo, setCidTipo] = useState('secundario')

  // Conduta
  const [trat, setTrat] = useState('')
  const [orient, setOrient] = useState('')
  const [retorno, setRetorno] = useState('7 dias')
  const [proced, setProced] = useState('')

  // Encaminhamentos
  const [encs, setEncs] = useState<any[]>([])
  const [novoEnc, setNovoEnc] = useState({esp:'Cardiologia',tipo:'Especialista',pri:'Alta',just:''})

  // Carregar dados do localStorage
  const carregarAgendamentos = () => {
    const stored = localStorage.getItem('agendamentos_consultas')
    if (stored) setAgendamentosLista(JSON.parse(stored))
  }

  const carregarRegistrosTardios = () => {
    const stored = localStorage.getItem('registros_tardios')
    if (stored) setRegistrosTardios(JSON.parse(stored))
  }

  const carregarExamesRealizados = () => {
    const stored = localStorage.getItem('exames_realizados')
    if (stored) setExamesRealizados(JSON.parse(stored))
  }

  // Salvar Agendamento
  const salvarAgendamento = () => {
    if (!agendamento.nome || !agendamento.cpf || !agendamento.dataNascimento || !agendamento.municipio) {
      alert('Preencha todos os campos obrigatórios (*)')
      return
    }

    const novoAgendamento = {
      id: Date.now(),
      ...agendamento,
      dataSolicitacao: new Date().toISOString(),
      status: 'agendado',
      medico: usuario?.nome
    }

    const stored = localStorage.getItem('agendamentos_consultas')
    const agendamentos = stored ? JSON.parse(stored) : []
    agendamentos.push(novoAgendamento)
    localStorage.setItem('agendamentos_consultas', JSON.stringify(agendamentos))
    
    // Salvar como paciente
    const pacientesStorage = localStorage.getItem('pacientes')
    const pacientes = pacientesStorage ? JSON.parse(pacientesStorage) : []
    const existe = pacientes.find((p: any) => p.cpf === agendamento.cpf)
    if (!existe) {
      pacientes.push({
        id: Date.now(),
        nome: agendamento.nome,
        cpf: agendamento.cpf,
        dataNascimento: agendamento.dataNascimento,
        sexo: agendamento.sexo,
        municipio: agendamento.municipio,
        criado_em: new Date().toISOString()
      })
      localStorage.setItem('pacientes', JSON.stringify(pacientes))
    }
    
    setAgendamentoSucesso(true)
    setTimeout(() => setAgendamentoSucesso(false), 3000)
    setAgendamento({
      nome: '', cpf: '', dataNascimento: '', sexo: 'Masculino', municipio: '',
      especialidade: 'Clínica Geral', dataAgendamento: '', horario: '09:00', profissional: '', observacoes: ''
    })
    carregarAgendamentos()
  }

  // Salvar Registro Tardio
  const salvarRegistroTardio = () => {
    if (!registroTardio.cidadao || !registroTardio.dataAtendimento || !registroTardio.justificativa) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const novoRegistro = {
      id: Date.now(),
      ...registroTardio,
      dataRegistro: new Date().toISOString(),
      status: 'registrado',
      profissional: usuario?.nome
    }

    const stored = localStorage.getItem('registros_tardios')
    const registros = stored ? JSON.parse(stored) : []
    registros.push(novoRegistro)
    localStorage.setItem('registros_tardios', JSON.stringify(registros))
    
    alert('Registro tardio salvo com sucesso!')
    setRegistroTardio({
      cidadao: '', dataAtendimento: '', horaAtendimento: '15:00',
      localAtendimento: 'UBS', justificativa: '', motivo: ''
    })
    carregarRegistrosTardios()
  }

  // Salvar Resultado de Exame
  const salvarResultadoExame = () => {
    if (!resultadoExame.exame || !resultadoExame.dataRealizacao) {
      alert('Preencha o nome do exame e a data de realização')
      return
    }

    const novoResultado = {
      id: Date.now(),
      ...resultadoExame,
      paciente: pacienteAtual?.nome || '',
      cpf: pacienteAtual?.cpf || '',
      dataRegistro: new Date().toISOString(),
      profissional: usuario?.nome
    }

    const stored = localStorage.getItem('exames_realizados')
    const exames = stored ? JSON.parse(stored) : []
    exames.push(novoResultado)
    localStorage.setItem('exames_realizados', JSON.stringify(exames))
    
    alert('Resultado de exame salvo com sucesso!')
    setResultadoExame({
      exame: '', dataRealizacao: '', dataResultado: '',
      resultado: 'Normal', descricao: ''
    })
    carregarExamesRealizados()
  }

  // Lista de tipos de serviço para registro tardio
  const TIPOS_SERVICO = [
    'ADM. MEDICAMENTO', 'DEMANDA ESPONTÂNEA', 'NEBULIZAÇÃO', 'VACINA',
    'ARBOVIROSES', 'ESCUTA INICIAL', 'ODONTOLOGIA', 'CURATIVO', 'EXAMES', 'PROCEDIMENTOS'
  ]

  // Lista de locais de atendimento
  const LOCAIS_ATENDIMENTO = ['UBS', 'DOMICÍLIO', 'ESCOLA', 'COMUNIDADE', 'UNIDADE MÓVEL']

  // Lista de justificativas
  const JUSTIFICATIVAS = [
    'Faltas de energia elétrica', 'PEC indisponível', 'Computador inoperante',
    'Sistema offline', 'Problemas de rede', 'Outros'
  ]

  const carregarPacientesMedicos = () => {
    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      const pacientes = JSON.parse(pacientesStorage)
      const paraAtendimento = pacientes.filter(p => p.status === 'aguardando_medico')
      setFilaMedica(paraAtendimento)
    } else {
      setFilaMedica([])
    }
  }

  const buscarPacientesExistentes = (termo: string) => {
    if (!termo || termo.length < 2) {
      setResultadosBusca([])
      return
    }
    const pacientesStorage = localStorage.getItem('pacientes')
    if (pacientesStorage) {
      const pacientes = JSON.parse(pacientesStorage)
      const resultados = pacientes.filter((p: any) => 
        p.nome.toLowerCase().includes(termo.toLowerCase()) ||
        p.cpf?.includes(termo)
      ).slice(0, 5)
      setResultadosBusca(resultados)
    }
  }

  const selecionarPacienteExistente = (paciente: any) => {
    setPacienteAtual({
      ...paciente,
      id: paciente.id,
      nome: paciente.nome,
      num: paciente.num || `P${String(paciente.id).slice(-4)}`,
      esp: paciente.esp || 'Consulta médica',
      dados_triagem: paciente.dados_triagem || null
    })
    setShowModal(false)
    setBuscaPaciente('')
    setResultadosBusca([])
    setFinalizado(false)
    
    setDocPaciente(paciente.nome)
    setDocCpf(paciente.cpf || '')
    setRegistroTardio(prev => ({ ...prev, cidadao: paciente.nome }))
    
    if (paciente.dados_triagem) {
      carregarDadosTriagem(paciente)
    }
  }

  const criarNovoPaciente = () => {
    if (!novoPaciente.nome) {
      alert('Preencha o nome do paciente')
      return
    }
    
    const pacientesStorage = localStorage.getItem('pacientes')
    const pacientes = pacientesStorage ? JSON.parse(pacientesStorage) : []
    
    const novoId = Date.now()
    const novoNum = `P${String(novoId).slice(-6)}`
    
    const paciente = {
      id: novoId,
      num: novoNum,
      nome: novoPaciente.nome,
      idade: novoPaciente.idade,
      sexo: novoPaciente.sexo,
      cpf: novoPaciente.cpf,
      telefone: novoPaciente.telefone,
      esp: 'Consulta médica',
      status: 'em_atendimento',
      dados_triagem: null,
      criado_em: new Date().toISOString()
    }
    
    pacientes.push(paciente)
    localStorage.setItem('pacientes', JSON.stringify(pacientes))
    
    setPacienteAtual(paciente)
    setDocPaciente(paciente.nome)
    setDocCpf(paciente.cpf || '')
    setRegistroTardio(prev => ({ ...prev, cidadao: paciente.nome }))
    setShowModal(false)
    setNovoPaciente({ nome: '', idade: '', sexo: 'Feminino', cpf: '', telefone: '' })
    setFinalizado(false)
  }

  const carregarDadosTriagem = (paciente: any) => {
    if (paciente.dados_triagem) {
      const dados = paciente.dados_triagem
      if (dados.sinais_vitais) {
        setVitais({
          pas: dados.sinais_vitais.pas || '',
          pad: dados.sinais_vitais.pad || '',
          fc: dados.sinais_vitais.fc || '',
          temp: dados.sinais_vitais.temp || '',
          sat: dados.sinais_vitais.sat || '',
          glic: dados.sinais_vitais.glic || '',
          peso: dados.sinais_vitais.peso || '',
          alt: dados.sinais_vitais.altura || ''
        })
      }
      if (dados.queixa) setQueixa(dados.queixa)
    }
  }

  const selecionarPaciente = (paciente: any) => {
    setPacienteAtual(paciente)
    setDocPaciente(paciente.nome)
    setDocCpf(paciente.cpf || '')
    setRegistroTardio(prev => ({ ...prev, cidadao: paciente.nome }))
    setFinalizado(false)
    carregarDadosTriagem(paciente)
    atualizarStatusPaciente(paciente.id, 'em_atendimento')
  }

  const atualizarStatusPaciente = (pacienteId: string, novoStatus: string) => {
    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      let pacientes = JSON.parse(pacientesStorage)
      pacientes = pacientes.map((p: any) => {
        if (p.id === pacienteId) {
          return { ...p, status: novoStatus }
        }
        return p
      })
      localStorage.setItem('pacientes_triagem', JSON.stringify(pacientes))
      carregarPacientesMedicos()
    }
  }

  const finalizarAtendimento = () => {
    if (pacienteAtual) {
      const prontuario = {
        paciente: pacienteAtual,
        anamnese: { queixa, hda, antPes, antFam, habitos, alergias, meds },
        exame_fisico: { vitais, egeral, cardio, resp, abd, neuro, ext },
        diagnosticos: cids,
        conduta: { trat, orient, retorno, proced },
        encaminhamentos: encs,
        data_atendimento: new Date().toISOString(),
        medico: usuario?.nome
      }
      
      const historicoStorage = localStorage.getItem('historico_atendimentos')
      const historico = historicoStorage ? JSON.parse(historicoStorage) : []
      historico.push(prontuario)
      localStorage.setItem('historico_atendimentos', JSON.stringify(historico))
      
      const pacientesStorage = localStorage.getItem('pacientes_triagem')
      if (pacientesStorage) {
        let pacientes = JSON.parse(pacientesStorage)
        pacientes = pacientes.filter((p: any) => p.id !== pacienteAtual.id)
        localStorage.setItem('pacientes_triagem', JSON.stringify(pacientes))
      }
      
      setFinalizado(true)
      setTimeout(() => {
        setFinalizado(false)
        setPacienteAtual(null)
        limparFormulario()
        carregarPacientesMedicos()
      }, 2000)
    }
  }

  const limparFormulario = () => {
    setQueixa('')
    setHda('')
    setAntPes('')
    setAntFam('')
    setHabitos('')
    setAlergias('')
    setMeds('')
    setVitais({pas:'',pad:'',fc:'',temp:'',sat:'',glic:'',peso:'',alt:''})
    setEgeral('')
    setCardio('')
    setResp('')
    setAbd('')
    setNeuro('')
    setExt('')
    setCids([])
    setTrat('')
    setOrient('')
    setProced('')
    setEncs([])
  }

  function addItem() { setItens(i => [...i, { id: Date.now().toString(), med:'', dose:'', pos:'', dur:'' }]) }
  function rmItem(id:string) { setItens(i => i.filter(x=>x.id!==id)) }
  function updItem(id:string, k:keyof MedItem, v:string) { setItens(i => i.map(x=>x.id===id?{...x,[k]:v}:x)) }

  function abrirDocumento(tipo: DocTipo) {
    setDocMedico(usuario?.nome || 'Dr(a).')
    setDocCrm('CRM/MA 12345')
    setDocTipo(tipo)
    setShowDocModal(true)
  }

  function imprimirDocumento() {
    if (!printRef.current) return
    const html = printRef.current.innerHTML
    const w = window.open('', '_blank', 'width=700,height=900')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Documento</title>
    <style>body{margin:20px;font-family:Arial,sans-serif;}@media print{body{margin:0;}}</style>
    </head><body>${html}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
    w.document.close()
  }

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.replace('/login'); return }
    setUsuario(JSON.parse(u))
    carregarPacientesMedicos()
    carregarAgendamentos()
    carregarRegistrosTardios()
    carregarExamesRealizados()
    
    // Setar período padrão (últimos 7 dias)
    const hoje = new Date()
    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(hoje.getDate() - 7)
    setPeriodoInicio(seteDiasAtras.toISOString().slice(0,10))
    setPeriodoFim(hoje.toISOString().slice(0,10))
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pacientes_triagem') carregarPacientesMedicos()
      if (e.key === 'agendamentos_consultas') carregarAgendamentos()
      if (e.key === 'registros_tardios') carregarRegistrosTardios()
      if (e.key === 'exames_realizados') carregarExamesRealizados()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [router])

  if (!usuario) return null

  const imc = vitais.peso && vitais.alt
    ? (parseFloat(vitais.peso) / ((parseFloat(vitais.alt)/100)**2)).toFixed(1) : null
  const imcC = imc ? parseFloat(imc)<18.5?'Abaixo do peso':parseFloat(imc)<25?'Normal':parseFloat(imc)<30?'Sobrepeso':'Obesidade' : null

  function salvar() { 
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
    if (pacienteAtual) {
      const progresso = {
        paciente: pacienteAtual,
        anamnese: { queixa, hda, antPes, antFam, habitos, alergias, meds },
        exame_fisico: { vitais, egeral, cardio, resp, abd, neuro, ext },
        diagnosticos: cids,
        conduta: { trat, orient, retorno, proced },
        encaminhamentos: encs,
        ultima_atualizacao: new Date().toISOString()
      }
      localStorage.setItem(`progresso_${pacienteAtual.id}`, JSON.stringify(progresso))
    }
  }

  function buscaCID(q: string) {
    setCidBusca(q)
    setCidResult(buscarCID(q) as [string,string][])
  }

  function addCID(codigo: string, desc: string) {
    if (cids.find(c=>c.codigo===codigo)) return
    setCids(c=>[...c,{id:Date.now().toString(),codigo,desc,tipo:cidTipo}])
    setCidBusca(''); setCidResult([])
  }

  function addEnc() {
    if (!novoEnc.just) return
    setEncs(e=>[...e,{...novoEnc,id:Date.now().toString()}])
    setNovoEnc({esp:'Cardiologia',tipo:'Especialista',pri:'Alta',just:''})
  }

  const currentIndex = ABAS.findIndex(a => a.id === aba)
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setAba(ABAS[currentIndex - 1].id)
      document.querySelector('.prontuario-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  const goToNext = () => {
    if (currentIndex < ABAS.length - 1) {
      setAba(ABAS[currentIndex + 1].id)
      document.querySelector('.prontuario-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const inp:any = {width:'100%',padding:'8px 10px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
  const ta:any  = {...inp,resize:'vertical',minHeight:68}
  const lbl:any = {fontSize:11,fontWeight:700,color:'#374151',display:'block',marginBottom:4}
  const fld:any = {display:'flex',flexDirection:'column',gap:3,marginBottom:10}
  const sec:any = {background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:18,marginBottom:14}

  const priBadge = (p:string) => ({
    Alta:  {bg:'#fee2e2',c:'#991b1b'},
    Media: {bg:'#fef9c3',c:'#854d0e'},
    Baixa: {bg:'#dcfce7',c:'#166534'},
  }[p] || {bg:'#f1f5f9',c:'#64748b'})

  const DOCS_RAPIDOS = [
    {l:'Receituario', tipo: 'receita' as DocTipo, cor:'#185FA5', bg:'#E6F1FB', emoji:'💊'},
    {l:'Exames', tipo: 'exames' as DocTipo, cor:'#3B6D11', bg:'#EAF3DE', emoji:'🔬'},
    {l:'Atestado', tipo: 'atestado' as DocTipo, cor:'#854F0B', bg:'#FAEEDA', emoji:'📋'},
    {l:'Encaminh.', tipo: 'encaminhamento' as DocTipo, cor:'#993556', bg:'#FBEAF0', emoji:'➡️'},
  ]

  const ESPECIALIDADES = [
    'Clínica Geral', 'Cardiologia', 'Pediatria', 'Ginecologia', 'Ortopedia',
    'Neurologia', 'Dermatologia', 'Oftalmologia', 'Psiquiatria', 'Urologia'
  ]

  const dadosDocumento = {
    paciente: docPaciente,
    cpf: docCpf,
    medico: docMedico,
    crm: docCrm,
    tipoRec, itens, obs,
    dias, dataInicio, cid, exibirCid,
    dataDoc, entrada, saida,
    tipoExame, exames, hipotese, urgente,
    especialidade, tipoEnc, prioridade, justificativa,
  }

  // Filtrar registros tardios
  const registrosFiltrados = registrosTardios.filter(r => {
    if (filtroRegistros === 'meus' && r.profissional !== usuario?.nome) return false
    if (periodoInicio && new Date(r.dataAtendimento) < new Date(periodoInicio)) return false
    if (periodoFim && new Date(r.dataAtendimento) > new Date(periodoFim)) return false
    return true
  }).sort((a, b) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'system-ui',background:'#f1f5f9'}}>

      {/* Sidebar mini */}
      <aside style={{width:56,background:'#0f172a',display:'flex',flexDirection:'column',alignItems:'center',padding:'14px 0',gap:6,flexShrink:0}}>
        <div style={{width:32,height:32,borderRadius:8,background:'#3ECF8E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#fff',fontWeight:700,marginBottom:10}}>+</div>
        {[{e:'🏠',h:'/recepcao'},{e:'🩺',h:'/triagem'},{e:'📒',h:'/prontuario'},{e:'📄',h:'/documentos'},{e:'📊',h:'/gestao'}].map(x=>(
          <div key={x.h} onClick={()=>router.push(x.h)}
            style={{width:38,height:38,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:17,cursor:'pointer',background:x.h==='/prontuario'?'rgba(62,207,142,.25)':'transparent'}}>
            {x.e}
          </div>
        ))}
        <div style={{marginTop:'auto',cursor:'pointer',fontSize:16,color:'#475569'}} onClick={()=>{localStorage.clear();router.push('/login')}}>↩</div>
      </aside>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Topbar */}
        <header style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 20px',height:54,
          display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12,flex:1}}>
            <div style={{width:38,height:38,borderRadius:'50%',background:'#FBEAF0',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#993556',flexShrink:0}}>
              {usuario?.nome?.split(' ').map((n:string)=>n[0]).slice(0,2).join('') || 'DR'}
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'#0f172a'}}>Dr(a). {usuario?.nome}</div>
              <div style={{fontSize:11,color:'#64748b'}}>{usuario?.perfil} · {new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
          <button onClick={salvar}
            style={{padding:'6px 16px',background:salvo?'#3B6D11':'#3ECF8E',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',transition:'background .2s'}}>
            {salvo?'Salvo!':'Salvar Progresso'}
          </button>
        </header>

        <div style={{display:'flex',flex:1,overflow:'hidden'}}>

          {/* Lista de pacientes */}
          <div style={{width:280,background:'#fff',borderRight:'1px solid #e2e8f0',overflowY:'auto',padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>🩺 Pacientes aguardando</div>
              <div style={{fontSize:11,color:'#94a3b8',background:'#f1f5f9',padding:'2px 8px',borderRadius:12}}>
                {filaMedica.length} pacientes
              </div>
            </div>
            
            <button onClick={() => setShowModal(true)} style={{width:'100%',padding:'10px',background:'#3ECF8E',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <span style={{fontSize:14}}>+</span> Novo Atendimento
            </button>

            {filaMedica.length === 0 && (
              <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>
                <div style={{fontSize:32,marginBottom:8}}>📭</div>
                <div style={{fontSize:12}}>Nenhum paciente aguardando</div>
              </div>
            )}
            
            {filaMedica.map(p => (
              <div key={p.id} onClick={() => selecionarPaciente(p)}
                style={{padding:'10px 12px',borderRadius:10,border:'1.5px solid',borderColor:pacienteAtual?.id === p.id ? '#3ECF8E' : '#e2e8f0',background:pacienteAtual?.id === p.id ? '#f0fdf4' : '#f8fafc',cursor:'pointer',marginBottom:8}}>
                <div style={{fontSize:14,fontWeight:800,color:'#3ECF8E',fontFamily:'monospace'}}>#{p.num}</div>
                <div style={{fontSize:13,fontWeight:600,color:'#0f172a',marginTop:2}}>{p.nome}</div>
                <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{p.esp}</div>
              </div>
            ))}
          </div>

          {/* Prontuario */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            
            {!pacienteAtual ? (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:16,color:'#94a3b8'}}>
                <div style={{fontSize:64}}>👨‍⚕️</div>
                <div style={{fontSize:16,fontWeight:600,color:'#0f172a'}}>Bem-vindo, Dr(a). {usuario?.nome}</div>
                <button onClick={() => setShowModal(true)} style={{padding:'12px 24px',background:'#3ECF8E',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  + Novo Atendimento
                </button>
              </div>
            ) : (
              <>
                {/* Cabeçalho com botões de documentos */}
                <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'12px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:40,height:40,borderRadius:'50%',background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#2563eb'}}>
                        {pacienteAtual.nome.split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>{pacienteAtual.nome}</div>
                        <div style={{fontSize:12,color:'#64748b'}}>Ficha #{pacienteAtual.num} · {pacienteAtual.esp}</div>
                      </div>
                    </div>
                    <button onClick={finalizarAtendimento} style={{padding:'8px 20px',background:finalizado?'#3B6D11':'#3ECF8E',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                      {finalizado ? '✓ Finalizado!' : 'Finalizar Atendimento'}
                    </button>
                  </div>
                  
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {DOCS_RAPIDOS.map(d => (
                      <button key={d.l} onClick={() => abrirDocumento(d.tipo)}
                        style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${d.cor}40`,background:d.bg,cursor:'pointer',fontSize:11,fontWeight:600,color:d.cor,transition:'all .15s',display:'flex',alignItems:'center',gap:5}}>
                        <span>{d.emoji}</span> {d.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{display:'flex',background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 16px',overflowX:'auto',flexShrink:0,flexWrap:'wrap'}}>
                  {ABAS.map(a=>(
                    <button key={a.id} onClick={()=>setAba(a.id)}
                      style={{padding:'10px 14px',fontSize:12,fontWeight:600,border:'none',background:'none',cursor:'pointer',whiteSpace:'nowrap',
                        borderBottom:'2px solid '+(aba===a.id?'#3ECF8E':'transparent'),
                        color:aba===a.id?'#3ECF8E':'#64748b'}}>
                      {a.emoji} {a.l}
                    </button>
                  ))}
                </div>

                <div className="prontuario-content" style={{flex:1,overflowY:'auto',padding:18}}>
                  
                  {/* Aba Anamnese */}
                  {aba==='anamnese' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Queixa e Historia da Doenca Atual</div>
                        <div style={fld}><label style={lbl}>Queixa principal</label><input style={inp} value={queixa} onChange={e=>setQueixa(e.target.value)} placeholder="Queixa principal do paciente..." /></div>
                        <div style={fld}><label style={lbl}>HDA</label><textarea style={{...ta,minHeight:90}} value={hda} onChange={e=>setHda(e.target.value)} placeholder="Descreva a história da doença atual..." /></div>
                      </div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Antecedentes, Habitos e Medicamentos</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                          <div style={fld}><label style={lbl}>Antecedentes pessoais</label><textarea style={ta} value={antPes} onChange={e=>setAntPes(e.target.value)} placeholder="Doenças pré-existentes..." /></div>
                          <div style={fld}><label style={lbl}>Antecedentes familiares</label><textarea style={ta} value={antFam} onChange={e=>setAntFam(e.target.value)} placeholder="Histórico de doenças na família..." /></div>
                          <div style={fld}><label style={lbl}>Habitos</label><textarea style={ta} value={habitos} onChange={e=>setHabitos(e.target.value)} placeholder="Tabagismo, etilismo..." /></div>
                          <div style={fld}><label style={lbl}>Alergias</label><textarea style={ta} value={alergias} onChange={e=>setAlergias(e.target.value)} placeholder="Medicamentos, alimentos..." /></div>
                          <div style={{...fld,gridColumn:'span 2'}}><label style={lbl}>Medicamentos</label><textarea style={ta} value={meds} onChange={e=>setMeds(e.target.value)} placeholder="Medicamentos em uso..." /></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aba Exame Fisico */}
                  {aba==='exame' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Sinais Vitais</div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
                          {VITAIS.map(vt=>{
                            const v = vitais[vt.k]||''
                            const st = stVital(vt.k,v)
                            const sc = ST[st]
                            return (
                              <div key={vt.k} style={{background:'#f8fafc',borderRadius:10,padding:'10px 12px'}}>
                                <div style={{fontSize:10,color:'#64748b',marginBottom:4}}>{vt.l}</div>
                                <div style={{display:'flex',alignItems:'center',gap:4}}>
                                  <input type="number" value={v} onChange={e=>setVitais(p=>({...p,[vt.k]:e.target.value}))}
                                    style={{flex:1,border:'1.5px solid '+(st==='alerta'?'#ef4444':st==='atencao'?'#eab308':'#e2e8f0'),borderRadius:7,padding:'6px 6px',fontSize:14,fontWeight:700,textAlign:'center',outline:'none'}} />
                                  <span style={{fontSize:9,color:'#94a3b8'}}>{vt.u}</span>
                                </div>
                                {sc && v && <div style={{marginTop:4,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,display:'inline-block',background:sc.bg,color:sc.c}}>{sc.t}</div>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Exame Fisico</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                          {[['Estado geral',egeral,setEgeral],['Cardiovascular',cardio,setCardio],['Respiratorio',resp,setResp],['Abdome',abd,setAbd],['Neurologico',neuro,setNeuro],['Extremidades',ext,setExt]].map(([l,v,fn]:any)=>(
                            <div key={l} style={fld}><label style={lbl}>{l}</label><textarea style={ta} value={v} onChange={e=>fn(e.target.value)} placeholder={`Exame ${l.toLowerCase()}...`} /></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aba Resultados - Solicitar Exames */}
                  {aba==='resultados' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Solicitar Exames</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                          <div style={fld}><label style={lbl}>Tipo de Exame</label><select style={inp}><option>Laboratorial</option><option>Raio-X</option><option>Tomografia</option><option>Ressonância</option><option>Ultrassonografia</option><option>ECG</option></select></div>
                          <div style={fld}><label style={lbl}>Data</label><input type="date" style={inp} /></div>
                        </div>
                        <button style={{padding:'8px 16px',background:'#185FA5',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Solicitar Exame</button>
                      </div>
                    </div>
                  )}

                  {/* Aba Diagnosticos */}
                  {aba==='diagnostico' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Buscar CID-10</div>
                        <div style={{position:'relative',marginBottom:10}}>
                          <input style={{...inp,paddingRight:120}} placeholder="Digite o codigo ou descricao" value={cidBusca} onChange={e=>buscaCID(e.target.value)} />
                          <select value={cidTipo} onChange={e=>setCidTipo(e.target.value)} style={{position:'absolute',right:0,top:0,height:'100%',padding:'0 8px',border:'none',borderLeft:'1.5px solid #e2e8f0',borderRadius:'0 8px 8px 0',fontSize:12,background:'#f8fafc',cursor:'pointer'}}>
                            <option value="principal">Principal</option><option value="secundario">Secundario</option>
                          </select>
                        </div>
                        {cidResultados.length > 0 && (
                          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden'}}>
                            {cidResultados.map(([cod,desc])=>(
                              <div key={cod} onClick={()=>addCID(cod,desc)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f1f5f9'}}>
                                <span style={{fontSize:12,fontWeight:700,color:'#185FA5',fontFamily:'monospace',minWidth:56}}>{cod}</span>
                                <span style={{fontSize:12,color:'#0f172a',flex:1}}>{desc}</span>
                                <span style={{fontSize:10,color:'#94a3b8'}}>+ Adicionar</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Diagnosticos</div>
                        {cids.map(c=>(
                          <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#f8fafc',borderRadius:8,marginBottom:6}}>
                            <span style={{fontSize:12,fontWeight:700,color:'#185FA5',minWidth:56}}>{c.codigo}</span>
                            <span style={{flex:1,fontSize:12}}>{c.desc}</span>
                            <button onClick={()=>setCids(cs=>cs.filter(x=>x.id!==c.id))} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}>x</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aba Conduta */}
                  {aba==='conduta' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Plano Terapeutico</div>
                        <div style={fld}><label style={lbl}>Tratamento</label><textarea style={{...ta,minHeight:100}} value={trat} onChange={e=>setTrat(e.target.value)} placeholder="Descreva o tratamento..." /></div>
                        <div style={fld}><label style={lbl}>Orientações</label><textarea style={{...ta,minHeight:100}} value={orient} onChange={e=>setOrient(e.target.value)} placeholder="Orientações ao paciente..." /></div>
                        <div style={fld}><label style={lbl}>Retorno</label><select style={inp} value={retorno} onChange={e=>setRetorno(e.target.value)}><option>7 dias</option><option>15 dias</option><option>30 dias</option><option>60 dias</option><option>Conforme resultado</option></select></div>
                      </div>
                    </div>
                  )}

                  {/* Aba Encaminhamentos */}
                  {aba==='encaminh' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Novo Encaminhamento</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                          <div style={fld}><label style={lbl}>Especialidade</label><select style={inp} value={novoEnc.esp} onChange={e=>setNovoEnc(p=>({...p,esp:e.target.value}))}><option>Cardiologia</option><option>Neurologia</option><option>Ortopedia</option><option>Ginecologia</option><option>Pediatria</option></select></div>
                          <div style={fld}><label style={lbl}>Prioridade</label><select style={inp} value={novoEnc.pri} onChange={e=>setNovoEnc(p=>({...p,pri:e.target.value}))}><option>Alta</option><option>Media</option><option>Baixa</option></select></div>
                          <div style={{...fld,gridColumn:'span 2'}}><label style={lbl}>Justificativa</label><textarea style={ta} value={novoEnc.just} onChange={e=>setNovoEnc(p=>({...p,just:e.target.value}))} placeholder="Justificativa clínica..." /></div>
                        </div>
                        <button onClick={addEnc} style={{marginTop:10,padding:'8px 18px',background:'#185FA5',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Registrar</button>
                      </div>
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Encaminhamentos</div>
                        {encs.map(e=>{
                          const pb = priBadge(e.pri)
                          return (
                            <div key={e.id} style={{display:'flex',gap:12,padding:'12px 14px',background:'#f8fafc',borderRadius:10,marginBottom:8}}>
                              <div><span style={{fontSize:13,fontWeight:700}}>{e.esp}</span><span style={{fontSize:10,marginLeft:8,padding:'2px 8px',borderRadius:20,background:pb.bg,color:pb.c}}>{e.pri}</span></div>
                              <div style={{fontSize:12,color:'#64748b'}}>{e.just}</div>
                              <button onClick={()=>setEncs(es=>es.filter(x=>x.id!==e.id))}>x</button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ABA 7 - AGENDAR CONSULTA */}
                  {aba==='agendamento' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:24}}>📅</span> Agendar Consulta
                        </div>
                        
                        {agendamentoSucesso && (
                          <div style={{background:'#dcfce7',border:'1px solid #86efac',borderRadius:8,padding:12,marginBottom:16,color:'#166534',fontSize:13,textAlign:'center'}}>
                            ✓ Consulta agendada com sucesso!
                          </div>
                        )}

                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                          <div style={{...fld,gridColumn:'span 2'}}>
                            <label style={lbl}>Nome completo *</label>
                            <input style={inp} type="text" placeholder="Nome do paciente" value={agendamento.nome} onChange={e=>setAgendamento({...agendamento,nome:e.target.value})} />
                          </div>
                          <div style={fld}>
                            <label style={lbl}>CPF</label>
                            <input style={inp} type="text" placeholder="000.000.000-00" value={agendamento.cpf} onChange={e=>setAgendamento({...agendamento,cpf:e.target.value})} />
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Data de nascimento *</label>
                            <input style={inp} type="date" value={agendamento.dataNascimento} onChange={e=>setAgendamento({...agendamento,dataNascimento:e.target.value})} />
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Sexo</label>
                            <select style={inp} value={agendamento.sexo} onChange={e=>setAgendamento({...agendamento,sexo:e.target.value})}>
                              <option>Masculino</option><option>Feminino</option><option>Outro</option>
                            </select>
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Município *</label>
                            <input style={inp} type="text" placeholder="Cidade" value={agendamento.municipio} onChange={e=>setAgendamento({...agendamento,municipio:e.target.value})} />
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Data Agendamento *</label>
                            <input style={inp} type="date" value={agendamento.dataAgendamento} onChange={e=>setAgendamento({...agendamento,dataAgendamento:e.target.value})} />
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Horário *</label>
                            <select style={inp} value={agendamento.horario} onChange={e=>setAgendamento({...agendamento,horario:e.target.value})}>
                              <option>08:00</option><option>08:30</option><option>09:00</option><option>09:30</option>
                              <option>10:00</option><option>10:30</option><option>11:00</option><option>13:00</option>
                              <option>13:30</option><option>14:00</option><option>14:30</option><option>15:00</option>
                              <option>15:30</option><option>16:00</option><option>16:30</option><option>17:00</option>
                            </select>
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Profissional</label>
                            <input style={inp} type="text" placeholder="Profissional responsável" value={agendamento.profissional} onChange={e=>setAgendamento({...agendamento,profissional:e.target.value})} />
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Especialidade</label>
                            <select style={inp} value={agendamento.especialidade} onChange={e=>setAgendamento({...agendamento,especialidade:e.target.value})}>
                              {ESPECIALIDADES.map(esp => <option key={esp}>{esp}</option>)}
                            </select>
                          </div>
                          <div style={{...fld,gridColumn:'span 2'}}>
                            <label style={lbl}>Observações</label>
                            <textarea style={ta} rows={2} placeholder="Observações adicionais..." value={agendamento.observacoes} onChange={e=>setAgendamento({...agendamento,observacoes:e.target.value})} />
                          </div>
                        </div>

                        <button onClick={salvarAgendamento} style={{width:'100%',marginTop:16,padding:'12px',background:'#3ECF8E',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>
                          📅 Agendar Consulta
                        </button>
                      </div>

                      {/* Lista de agendamentos recentes */}
                      {agendamentosLista.length > 0 && (
                        <div style={sec}>
                          <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Consultas Agendadas</div>
                          {agendamentosLista.filter(a => a.nome === pacienteAtual?.nome || !pacienteAtual).slice(-5).reverse().map((a: any) => (
                            <div key={a.id} style={{padding:'10px 12px',background:'#f8fafc',borderRadius:8,marginBottom:8,border:'1px solid #e2e8f0'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <div>
                                  <div style={{fontSize:13,fontWeight:600}}>{a.nome}</div>
                                  <div style={{fontSize:11,color:'#64748b'}}>{a.especialidade} • {a.municipio}</div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                  <div style={{fontSize:11,fontWeight:600,color:'#3ECF8E'}}>{a.dataAgendamento}</div>
                                  <div style={{fontSize:10,color:'#94a3b8'}}>{a.horario}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ABA 8 - REGISTRO TARDIO */}
                  {aba==='registroTardio' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:24}}>⏰</span> Registro Tardio de Atendimento
                        </div>
                        <p style={{fontSize:12,color:'#64748b',marginBottom:16}}>
                          Registre os atendimentos na ordem cronológica em que ocorreram. Registros anteriores ao último atendimento não serão possíveis.
                        </p>

                        <div style={{marginBottom:16}}>
                          <label style={lbl}>Cidadão *</label>
                          <input style={inp} type="text" placeholder="Nome do cidadão" value={registroTardio.cidadao} onChange={e=>setRegistroTardio({...registroTardio,cidadao:e.target.value})} />
                        </div>

                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                          <div style={fld}>
                            <label style={lbl}>Data do Atendimento *</label>
                            <input style={inp} type="date" value={registroTardio.dataAtendimento} onChange={e=>setRegistroTardio({...registroTardio,dataAtendimento:e.target.value})} />
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Hora *</label>
                            <select style={inp} value={registroTardio.horaAtendimento} onChange={e=>setRegistroTardio({...registroTardio,horaAtendimento:e.target.value})}>
                              <option>08:00</option><option>09:00</option><option>10:00</option><option>11:00</option>
                              <option>13:00</option><option>14:00</option><option>15:00</option><option>16:00</option><option>17:00</option>
                            </select>
                          </div>
                        </div>

                        <div style={fld}>
                          <label style={lbl}>Local de Atendimento *</label>
                          <select style={inp} value={registroTardio.localAtendimento} onChange={e=>setRegistroTardio({...registroTardio,localAtendimento:e.target.value})}>
                            {LOCAIS_ATENDIMENTO.map(l => <option key={l}>{l}</option>)}
                          </select>
                        </div>

                        <div style={fld}>
                          <label style={lbl}>Justificativa *</label>
                          <select style={inp} value={registroTardio.justificativa} onChange={e=>setRegistroTardio({...registroTardio,justificativa:e.target.value})}>
                            <option value="">Selecione...</option>
                            {JUSTIFICATIVAS.map(j => <option key={j}>{j}</option>)}
                          </select>
                        </div>

                        <div style={fld}>
                          <label style={lbl}>Tipo de Serviço</label>
                          <select style={inp} value={registroTardio.motivo} onChange={e=>setRegistroTardio({...registroTardio,motivo:e.target.value})}>
                            <option value="">Selecione...</option>
                            {TIPOS_SERVICO.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>

                        <div style={{display:'flex',gap:12,marginTop:16}}>
                          <button onClick={() => {
                            setRegistroTardio({cidadao: '', dataAtendimento: '', horaAtendimento: '15:00', localAtendimento: 'UBS', justificativa: '', motivo: ''})
                            setRegistroTardio(prev => ({...prev, cidadao: pacienteAtual?.nome || ''}))
                          }} style={{padding:'8px 16px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer'}}>Limpar campos</button>
                          <button onClick={salvarRegistroTardio} style={{padding:'8px 20px',background:'#3ECF8E',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>Adicionar</button>
                        </div>
                      </div>

                      {/* Filtros e Lista de Registros */}
                      <div style={sec}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Registros Tardios</div>
                        
                        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
                            <input type="checkbox" checked={filtroRegistros === 'meus'} onChange={() => setFiltroRegistros(filtroRegistros === 'meus' ? 'todos' : 'meus')} /> Ver somente meus registros
                          </label>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            <span style={{fontSize:11}}>Período:</span>
                            <input type="date" style={{...inp,width:130}} value={periodoInicio} onChange={e=>setPeriodoInicio(e.target.value)} />
                            <span>até</span>
                            <input type="date" style={{...inp,width:130}} value={periodoFim} onChange={e=>setPeriodoFim(e.target.value)} />
                          </div>
                          <button onClick={() => {setFiltroRegistros('todos'); setPeriodoInicio(''); setPeriodoFim('')}} style={{fontSize:11,padding:'4px 12px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:6,cursor:'pointer'}}>Voltar para padrão</button>
                        </div>

                        <div style={{fontSize:11,color:'#64748b',marginBottom:12}}>
                          Status: Aguardando registro, Em registro | Período: {periodoInicio || 'início'} até {periodoFim || 'hoje'}
                        </div>

                        {registrosFiltrados.length === 0 ? (
                          <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>Nenhum resultado encontrado.</div>
                        ) : (
                          registrosFiltrados.map(r => (
                            <div key={r.id} style={{padding:'12px',background:'#f8fafc',borderRadius:8,marginBottom:8,border:'1px solid #e2e8f0'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <div>
                                  <div style={{fontSize:13,fontWeight:600}}>{r.cidadao}</div>
                                  <div style={{fontSize:11,color:'#64748b'}}>{r.dataAtendimento} {r.horaAtendimento} • {r.localAtendimento}</div>
                                  <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{r.justificativa}</div>
                                </div>
                                <div style={{fontSize:10,background:'#dcfce7',color:'#166534',padding:'2px 8px',borderRadius:12}}>{r.status}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* ABA 9 - RESULTADOS DE EXAMES */}
                  {aba==='resultadosExames' && (
                    <div>
                      <div style={sec}>
                        <div style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:24}}>🔬</span> Adicionar Resultados de Exames
                        </div>

                        <div style={fld}>
                          <label style={lbl}>Adicionar exame sem solicitação</label>
                          <input style={inp} type="text" placeholder="Pesquise por exame para inserir o resultado" value={resultadoExame.exame} onChange={e=>setResultadoExame({...resultadoExame,exame:e.target.value})} />
                        </div>

                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                          <div style={fld}>
                            <label style={lbl}>Exames realizados em</label>
                            <input style={inp} type="date" value={resultadoExame.dataRealizacao} onChange={e=>setResultadoExame({...resultadoExame,dataRealizacao:e.target.value})} />
                          </div>
                          <div style={fld}>
                            <label style={lbl}>Resultados em</label>
                            <input style={inp} type="date" value={resultadoExame.dataResultado} onChange={e=>setResultadoExame({...resultadoExame,dataResultado:e.target.value})} />
                          </div>
                        </div>

                        <div style={fld}>
                          <label style={lbl}>Resultado</label>
                          <select style={inp} value={resultadoExame.resultado} onChange={e=>setResultadoExame({...resultadoExame,resultado:e.target.value})}>
                            <option>Normal</option><option>Alterado</option><option>Sugestivo de infecção congênita</option>
                            <option>Outras alterações</option><option>Indeterminado</option><option>Anormal</option>
                          </select>
                        </div>

                        <div style={fld}>
                          <label style={lbl}>Descrição</label>
                          <textarea style={{...ta,minHeight:100}} placeholder="Descreva os resultados do exame..." value={resultadoExame.descricao} onChange={e=>setResultadoExame({...resultadoExame,descricao:e.target.value})} />
                          <div style={{fontSize:10,color:'#94a3b8',textAlign:'right'}}>{resultadoExame.descricao.length}/2000 caracteres</div>
                        </div>

                        <div style={{display:'flex',gap:12,marginTop:16}}>
                          <button onClick={() => setResultadoExame({exame:'',dataRealizacao:'',dataResultado:'',resultado:'Normal',descricao:''})} style={{padding:'8px 16px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer'}}>Cancelar</button>
                          <button onClick={salvarResultadoExame} style={{padding:'8px 20px',background:'#3ECF8E',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>Salvar</button>
                        </div>
                      </div>

                      {/* Lista de exames realizados */}
                      {examesRealizados.length > 0 && (
                        <div style={sec}>
                          <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Exames Realizados</div>
                          {examesRealizados.filter(e => e.paciente === pacienteAtual?.nome).slice(-5).reverse().map((e: any) => (
                            <div key={e.id} style={{padding:'12px',background:'#f8fafc',borderRadius:8,marginBottom:8,border:'1px solid #e2e8f0'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <div>
                                  <div style={{fontSize:13,fontWeight:600}}>{e.exame}</div>
                                  <div style={{fontSize:11,color:'#64748b'}}>Realizado: {e.dataRealizacao} • Resultado: {e.dataResultado || 'pendente'}</div>
                                  <div style={{fontSize:12,marginTop:4}}><strong>Resultado:</strong> {e.resultado}</div>
                                  {e.descricao && <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{e.descricao.substring(0,100)}...</div>}
                                </div>
                                <div style={{fontSize:10,background:e.resultado === 'Normal' ? '#dcfce7' : '#fee2e2',color:e.resultado === 'Normal' ? '#166534' : '#991b1b',padding:'2px 8px',borderRadius:12}}>{e.resultado}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões de navegação */}
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:24,padding:'16px 0',borderTop:'1px solid #e2e8f0'}}>
                    <button onClick={goToPrevious} disabled={currentIndex===0} style={{padding:'10px 20px',border:'1.5px solid #3ECF8E',borderRadius:10,background:'#fff',color:'#3ECF8E',fontWeight:600,cursor:currentIndex===0?'not-allowed':'pointer',opacity:currentIndex===0?0.5:1}}>← Anterior</button>
                    <div style={{fontSize:12,color:'#64748b',background:'#f1f5f9',padding:'6px 16px',borderRadius:20}}>{currentIndex+1}/{ABAS.length}</div>
                    <button onClick={goToNext} disabled={currentIndex===ABAS.length-1} style={{padding:'10px 20px',background:'#3ECF8E',border:'none',borderRadius:10,color:'#fff',fontWeight:600,cursor:currentIndex===ABAS.length-1?'not-allowed':'pointer',opacity:currentIndex===ABAS.length-1?0.5:1}}>Próximo →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Documentos */}
      {showDocModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={() => setShowDocModal(false)}>
          <div style={{background:'#fff',borderRadius:16,width:'90%',maxWidth:700,maxHeight:'90vh',overflow:'auto',padding:24}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:700,color:'#0f172a'}}>Emissão de Documento</h3>
              <button onClick={() => setShowDocModal(false)} style={{background:'none',border:'none',fontSize:24,cursor:'pointer'}}>×</button>
            </div>

            {docTipo === 'receita' && (
              <div>
                <div style={fld}><label style={lbl}>Tipo de receituario</label>
                  <select style={inp} value={tipoRec} onChange={e=>setTipoRec(e.target.value)}>
                    <option value="simples">Simples</option><option value="especial">Controle Especial</option><option value="continuo">Uso Continuo</option>
                  </select>
                </div>
                {itens.map((item,i)=>(
                  <div key={item.id} style={{background:'#f8fafc',borderRadius:8,padding:10,marginBottom:8,position:'relative'}}>
                    {itens.length>1 && <button onClick={()=>rmItem(item.id)} style={{position:'absolute',top:8,right:8,background:'none',border:'none',cursor:'pointer'}}>x</button>}
                    <input style={{...inp,marginBottom:4}} placeholder="Medicamento" value={item.med} onChange={e=>updItem(item.id,'med',e.target.value)} />
                    <input style={{...inp,marginBottom:4}} placeholder="Dosagem" value={item.dose} onChange={e=>updItem(item.id,'dose',e.target.value)} />
                    <input style={{...inp,marginBottom:4}} placeholder="Posologia" value={item.pos} onChange={e=>updItem(item.id,'pos',e.target.value)} />
                    <input style={inp} placeholder="Duração" value={item.dur} onChange={e=>updItem(item.id,'dur',e.target.value)} />
                  </div>
                ))}
                <button onClick={addItem} style={{width:'100%',padding:'7px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,marginBottom:10}}>+ Medicamento</button>
                <div style={fld}><label style={lbl}>Observações</label><textarea style={inp} value={obs} onChange={e=>setObs(e.target.value)} rows={3} /></div>
              </div>
            )}

            {docTipo === 'atestado' && (
              <div>
                <div style={fld}><label style={lbl}>Dias de afastamento</label><input type="number" style={inp} value={dias} onChange={e=>setDias(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>Data de início</label><input type="date" style={inp} value={dataInicio} onChange={e=>setDataInicio(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>CID (opcional)</label><input style={inp} value={cid} onChange={e=>setCid(e.target.value)} placeholder="Ex: I10" /></div>
              </div>
            )}

            {docTipo === 'declaracao' && (
              <div>
                <div style={fld}><label style={lbl}>Data</label><input type="date" style={inp} value={dataDoc} onChange={e=>setDataDoc(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>Entrada</label><input type="time" style={inp} value={entrada} onChange={e=>setEntrada(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>Saída</label><input type="time" style={inp} value={saida} onChange={e=>setSaida(e.target.value)} /></div>
              </div>
            )}

            {docTipo === 'exames' && (
              <div>
                <div style={fld}><label style={lbl}>Tipo</label><select style={inp} value={tipoExame} onChange={e=>setTipoExame(e.target.value)}><option>Laboratoriais</option><option>Imagem</option><option>ECG</option></select></div>
                {exames.map((e,i)=>(
                  <input key={i} style={{...inp,marginBottom:6}} placeholder={`Exame ${i+1}`} value={e} onChange={ev=>setExames(ex=>ex.map((x,j)=>j===i?ev.target.value:x))} />
                ))}
                <button onClick={()=>setExames(e=>[...e,''])} style={{width:'100%',padding:'7px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,marginBottom:10}}>+ Exame</button>
                <div style={fld}><label style={lbl}>Hipótese diagnóstica</label><input style={inp} value={hipotese} onChange={e=>setHipotese(e.target.value)} /></div>
                <label style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={urgente} onChange={e=>setUrgente(e.target.checked)} /> Urgente</label>
              </div>
            )}

            {docTipo === 'encaminhamento' && (
              <div>
                <div style={fld}><label style={lbl}>Especialidade</label><select style={inp} value={especialidade} onChange={e=>setEspec(e.target.value)}><option>Cardiologia</option><option>Neurologia</option><option>Ortopedia</option></select></div>
                <div style={fld}><label style={lbl}>Prioridade</label><select style={inp} value={prioridade} onChange={e=>setPriori(e.target.value)}><option>Alta</option><option>Média</option><option>Baixa</option></select></div>
                <div style={fld}><label style={lbl}>Justificativa</label><textarea style={inp} rows={4} value={justificativa} onChange={e=>setJustif(e.target.value)} /></div>
              </div>
            )}

            <div style={{marginTop:24}}>
              <div ref={printRef}>
                <DocPreview tipo={docTipo} dados={dadosDocumento} />
              </div>
            </div>

            <div style={{display:'flex',gap:12,marginTop:24}}>
              <button onClick={() => setShowDocModal(false)} style={{flex:1,padding:'10px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer'}}>Cancelar</button>
              <button onClick={imprimirDocumento} style={{flex:1,padding:'10px',background:'#185FA5',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>🖨️ Imprimir / PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Atendimento */}
      {showModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={() => setShowModal(false)}>
          <div style={{background:'#fff',borderRadius:16,width:'90%',maxWidth:500,maxHeight:'80vh',overflow:'auto',padding:24}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:700,color:'#0f172a'}}>Novo Atendimento</h3>
              <button onClick={() => setShowModal(false)} style={{background:'none',border:'none',fontSize:24,cursor:'pointer'}}>×</button>
            </div>

            <div style={{marginBottom:24}}>
              <label style={lbl}>Buscar paciente existente</label>
              <input type="text" style={inp} placeholder="Digite o nome ou CPF..." value={buscaPaciente} onChange={(e) => {setBuscaPaciente(e.target.value); buscarPacientesExistentes(e.target.value)}} />
              {resultadosBusca.length > 0 && (
                <div style={{marginTop:8,border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
                  {resultadosBusca.map(p => (
                    <div key={p.id} onClick={() => selecionarPacienteExistente(p)} style={{padding:'10px 12px',cursor:'pointer',borderBottom:'1px solid #e2e8f0'}}>
                      <div style={{fontWeight:600}}>{p.nome}</div>
                      <div style={{fontSize:11,color:'#64748b'}}>CPF: {p.cpf || 'Não informado'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{textAlign:'center',margin:'16px 0',color:'#94a3b8'}}>— ou —</div>

            <div><label style={lbl}>Nome completo *</label><input type="text" style={inp} value={novoPaciente.nome} onChange={e=>setNovoPaciente(p=>({...p,nome:e.target.value}))} /></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
              <div><label style={lbl}>Idade</label><input type="text" style={inp} value={novoPaciente.idade} onChange={e=>setNovoPaciente(p=>({...p,idade:e.target.value}))} /></div>
              <div><label style={lbl}>Sexo</label><select style={inp} value={novoPaciente.sexo} onChange={e=>setNovoPaciente(p=>({...p,sexo:e.target.value}))}><option>Feminino</option><option>Masculino</option></select></div>
            </div>
            <div style={{marginTop:12}}><label style={lbl}>CPF</label><input type="text" style={inp} value={novoPaciente.cpf} onChange={e=>setNovoPaciente(p=>({...p,cpf:e.target.value}))} /></div>

            <div style={{display:'flex',gap:12,marginTop:24}}>
              <button onClick={() => setShowModal(false)} style={{flex:1,padding:'10px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer'}}>Cancelar</button>
              <button onClick={criarNovoPaciente} style={{flex:1,padding:'10px',background:'#3ECF8E',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>Iniciar Atendimento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 