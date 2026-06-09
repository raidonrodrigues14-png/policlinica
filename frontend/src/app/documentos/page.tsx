'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Tipos ──────────────────────────────────────────────────────
type DocTipo = 'receita'|'atestado'|'declaracao'|'exames'|'encaminhamento'

interface MedItem { id:string; med:string; dose:string; pos:string; dur:string }

// ── Dados do medico/unidade ────────────────────────────────────
const UNIDADE = {
  prefeitura: 'PREFEITURA MUNICIPAL',
  secretaria: 'Secretaria Municipal de Saude',
  unidade:    'Policlinica Municipal',
  cnes:       '1234567',
  endereco:   'Av. Principal, 100 - Centro',
  municipio:  'Alto Alegre do Maranhao - MA',
  telefone:   '(99) 3333-4444',
}

// ── Componente: Preview do documento ──────────────────────────
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
    <>
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
    </>
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

  // RECEITUARIO
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

  // ATESTADO
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

  // DECLARACAO
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
      <div style={estilos.footer}>
        <div style={estilos.carimbo}>Carimbo</div>
        <div style={estilos.assinatura}><div style={estilos.linha} /><div style={estilos.dr}>Responsavel pela Recepcao</div><div style={estilos.crm}>{UNIDADE.unidade}</div></div>
        <div style={{ fontSize:10, color:'#555', textAlign:'right' }}>{UNIDADE.municipio}<br/>{hoje}</div>
      </div>
      <div style={estilos.valida}>Valide em: policlinica.municipio.gov.br/validar</div>
    </div>
  )

  // EXAMES
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

  // ENCAMINHAMENTO
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

// ── Pagina principal ───────────────────────────────────────────
export default function DocumentosPage() {
  const router  = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [usuario, setUsuario] = useState<any>(null)
  const [tipo, setTipo]       = useState<DocTipo>('receita')

  // Dados compartilhados
  const [paciente, setPaciente] = useState('Joao Santos')
  const [cpf,      setCpf]      = useState('987.654.321-00')
  const [medico,   setMedico]   = useState('Dr. Roberto Nunes')
  const [crm,      setCrm]      = useState('CRM/MA 12345')

  // Receituario
  const [tipoRec, setTipoRec] = useState('simples')
  const [itens,   setItens]   = useState<MedItem[]>([{ id:'1', med:'', dose:'', pos:'', dur:'' }])
  const [obs,     setObs]     = useState('')

  // Atestado
  const [dias,       setDias]       = useState('2')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0,10))
  const [cid,        setCid]        = useState('')
  const [exibirCid,  setExibirCid]  = useState('nao')

  // Declaracao
  const [dataDoc,  setDataDoc]  = useState(new Date().toISOString().slice(0,10))
  const [entrada,  setEntrada]  = useState('09:00')
  const [saida,    setSaida]    = useState('10:30')

  // Exames
  const [tipoExame, setTipoExame] = useState('Laboratoriais')
  const [exames,    setExames]    = useState(['','','',''])
  const [hipotese,  setHipotese]  = useState('')
  const [urgente,   setUrgente]   = useState(false)

  // Encaminhamento
  const [especialidade, setEspec]  = useState('Cardiologia')
  const [tipoEnc,       setTipoEnc]= useState('Especialista')
  const [prioridade,    setPriori] = useState('Alta')
  const [justificativa, setJustif] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.replace('/login'); return }
    setUsuario(JSON.parse(u))
  }, [router])

  if (!usuario) return null

  function addItem() { setItens(i => [...i, { id: Date.now().toString(), med:'', dose:'', pos:'', dur:'' }]) }
  function rmItem(id:string) { setItens(i => i.filter(x=>x.id!==id)) }
  function updItem(id:string, k:keyof MedItem, v:string) { setItens(i => i.map(x=>x.id===id?{...x,[k]:v}:x)) }

  function imprimir() {
    if (!printRef.current) return
    const html = printRef.current.innerHTML
    const w = window.open('','_blank','width=700,height=900')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Documento</title>
    <style>body{margin:20px;font-family:Arial,sans-serif;}@media print{body{margin:0;}}</style>
    </head><body>${html}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
    w.document.close()
  }

  function voltarParaProntuario() {
    router.push('/prontuario')
  }

  const dados = {
    paciente, cpf, medico, crm,
    tipoRec, itens, obs,
    dias, dataInicio, cid, exibirCid,
    dataDoc, entrada, saida,
    tipoExame, exames, hipotese, urgente,
    especialidade, tipoEnc, prioridade, justificativa,
  }

  const TIPOS: { id:DocTipo; label:string; cor:string; bg:string; emoji:string }[] = [
    { id:'receita',        label:'Receituario',   cor:'#185FA5', bg:'#E6F1FB', emoji:'💊' },
    { id:'atestado',       label:'Atestado',      cor:'#854F0B', bg:'#FAEEDA', emoji:'📋' },
    { id:'declaracao',     label:'Declaracao',    cor:'#3B6D11', bg:'#EAF3DE', emoji:'📄' },
    { id:'exames',         label:'Exames',        cor:'#0F6E56', bg:'#E1F5EE', emoji:'🔬' },
    { id:'encaminhamento', label:'Encaminham.',   cor:'#993556', bg:'#FBEAF0', emoji:'➡️' },
  ]

  const inp:any = { width:'100%', padding:'8px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const lbl:any = { fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }
  const fld:any = { display:'flex', flexDirection:'column', gap:3, marginBottom:10 }

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'system-ui', background:'#f1f5f9' }}>

      {/* Sidebar */}
      <aside style={{ width:200, background:'#0f172a', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,.07)', fontSize:13, fontWeight:700, color:'#fff' }}>PoliclinicaMed</div>
        <nav style={{ flex:1, padding:'10px 0' }}>
          {[{l:'Recepcao',h:'/recepcao',e:'🏠'},{l:'Triagem',h:'/triagem',e:'🩺'},{l:'Prontuario',h:'/prontuario',e:'📒'},{l:'Documentos',h:'/documentos',e:'📄'},{l:'Gestao',h:'/gestao',e:'📊'}].map(x=>(
            <div key={x.h} onClick={()=>router.push(x.h)}
              style={{ padding:'9px 16px', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                color: x.h==='/documentos'?'#fff':'#64748b',
                fontWeight: x.h==='/documentos'?700:400,
                borderLeft: x.h==='/documentos'?'3px solid #3ECF8E':'3px solid transparent',
                background: x.h==='/documentos'?'rgba(62,207,142,.15)':'transparent' }}>
              {x.e} {x.l}
            </div>
          ))}
        </nav>
        <div onClick={()=>{localStorage.clear();router.push('/login')}}
          style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.07)', fontSize:11, color:'#475569', cursor:'pointer' }}>
          Sair
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <header style={{ height:52, background:'#fff', borderBottom:'1px solid #e2e8f0',
          display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', gap:12, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Botão Voltar para Prontuário */}
            <button 
              onClick={voltarParaProntuario}
              style={{ 
                display:'flex', 
                alignItems:'center', 
                gap:6,
                padding:'6px 14px', 
                background:'#f1f5f9', 
                border:'1px solid #e2e8f0', 
                borderRadius:8, 
                fontSize:12, 
                fontWeight:600, 
                cursor:'pointer', 
                color:'#64748b',
                transition:'all .2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0'
                e.currentTarget.style.color = '#0f172a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
                e.currentTarget.style.color = '#64748b'
              }}
            >
              ← Voltar ao Prontuário
            </button>
            <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>Emissao de Documentos</div>
          </div>
          <button onClick={imprimir}
            style={{ padding:'7px 18px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            🖨️ Imprimir / PDF
          </button>
        </header>

        <div style={{ flex:1, display:'grid', gridTemplateColumns:'300px 1fr', overflow:'hidden' }}>

          {/* Formulario */}
          <div style={{ borderRight:'1px solid #e2e8f0', overflowY:'auto', padding:16, background:'#fff' }}>

            {/* Seletor de tipo */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>Tipo de documento</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {TIPOS.map(t=>(
                  <button key={t.id} onClick={()=>setTipo(t.id)}
                    style={{ padding:'10px 8px', borderRadius:9, border:`1.5px solid ${tipo===t.id?t.cor:'#e2e8f0'}`,
                      background: tipo===t.id?t.bg:'#f8fafc', cursor:'pointer', fontSize:11, fontWeight:700,
                      color: tipo===t.id?t.cor:'#64748b', transition:'all .15s', display:'flex', alignItems:'center', gap:6 }}>
                    <span>{t.emoji}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paciente */}
            <div style={{ background:'#f8fafc', borderRadius:10, padding:12, marginBottom:14, border:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>Paciente</div>
              <div style={fld}><label style={lbl}>Nome</label><input style={inp} value={paciente} onChange={e=>setPaciente(e.target.value)} /></div>
              <div style={fld}><label style={lbl}>CPF</label><input style={inp} value={cpf} onChange={e=>setCpf(e.target.value)} /></div>
            </div>

            {/* Medico */}
            <div style={{ background:'#f8fafc', borderRadius:10, padding:12, marginBottom:14, border:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>Medico</div>
              <div style={fld}><label style={lbl}>Nome</label><input style={inp} value={medico} onChange={e=>setMedico(e.target.value)} /></div>
              <div style={fld}><label style={lbl}>CRM</label><input style={inp} value={crm} onChange={e=>setCrm(e.target.value)} /></div>
            </div>

            {/* Campos especificos por tipo */}
            {tipo === 'receita' && (
              <div>
                <div style={fld}><label style={lbl}>Tipo de receituario</label>
                  <select style={inp} value={tipoRec} onChange={e=>setTipoRec(e.target.value)}>
                    <option value="simples">Simples</option>
                    <option value="especial">Controle Especial</option>
                    <option value="continuo">Uso Continuo</option>
                  </select>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8 }}>Medicamentos</div>
                {itens.map((item,i)=>(
                  <div key={item.id} style={{ background:'#f8fafc', borderRadius:8, padding:10, marginBottom:8, border:'1px solid #e2e8f0', position:'relative' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#185FA5', marginBottom:6 }}>Medicamento {i+1}</div>
                    {itens.length>1 && <button onClick={()=>rmItem(item.id)} style={{ position:'absolute', top:8, right:8, background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:14 }}>x</button>}
                    <input style={{...inp, marginBottom:4}} placeholder="Nome do medicamento" value={item.med} onChange={e=>updItem(item.id,'med',e.target.value)} />
                    <input style={{...inp, marginBottom:4}} placeholder="Dosagem (ex: 50mg)" value={item.dose} onChange={e=>updItem(item.id,'dose',e.target.value)} />
                    <input style={{...inp, marginBottom:4}} placeholder="Posologia (ex: 1 cp 2x/dia)" value={item.pos} onChange={e=>updItem(item.id,'pos',e.target.value)} />
                    <input style={inp} placeholder="Duracao (ex: por 7 dias)" value={item.dur} onChange={e=>updItem(item.id,'dur',e.target.value)} />
                  </div>
                ))}
                <button onClick={addItem} style={{ width:'100%', padding:'7px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, cursor:'pointer', color:'#374151', marginBottom:10 }}>+ Adicionar medicamento</button>
                <div style={fld}><label style={lbl}>Observacoes</label><textarea style={{...inp, resize:'vertical', minHeight:56}} value={obs} onChange={e=>setObs(e.target.value)} /></div>
              </div>
            )}

            {tipo === 'atestado' && (
              <div>
                <div style={fld}><label style={lbl}>Dias de afastamento</label><input type="number" style={inp} min="1" value={dias} onChange={e=>setDias(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>A partir de</label><input type="date" style={inp} value={dataInicio} onChange={e=>setDataInicio(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>CID (opcional)</label><input style={inp} placeholder="Ex: I10" value={cid} onChange={e=>setCid(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>Exibir CID no documento?</label>
                  <select style={inp} value={exibirCid} onChange={e=>setExibirCid(e.target.value)}>
                    <option value="nao">Nao (padrao)</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
              </div>
            )}

            {tipo === 'declaracao' && (
              <div>
                <div style={fld}><label style={lbl}>Data</label><input type="date" style={inp} value={dataDoc} onChange={e=>setDataDoc(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>Horario de entrada</label><input type="time" style={inp} value={entrada} onChange={e=>setEntrada(e.target.value)} /></div>
                <div style={fld}><label style={lbl}>Horario de saida</label><input type="time" style={inp} value={saida} onChange={e=>setSaida(e.target.value)} /></div>
              </div>
            )}

            {tipo === 'exames' && (
              <div>
                <div style={fld}><label style={lbl}>Tipo de exame</label>
                  <select style={inp} value={tipoExame} onChange={e=>setTipoExame(e.target.value)}>
                    <option>Laboratoriais</option><option>Ultrassonografia</option>
                    <option>Raio-X</option><option>Tomografia</option>
                    <option>Ressonancia</option><option>ECG</option>
                  </select>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:6 }}>Exames solicitados</div>
                {exames.map((e,i)=>(
                  <input key={i} style={{...inp, marginBottom:6}} placeholder={`Exame ${i+1}`} value={e} onChange={ev=>setExames(ex=>ex.map((x,j)=>j===i?ev.target.value:x))} />
                ))}
                <button onClick={()=>setExames(e=>[...e,''])} style={{ width:'100%', padding:'7px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, cursor:'pointer', color:'#374151', marginBottom:10 }}>+ Adicionar exame</button>
                <div style={fld}><label style={lbl}>Hipotese diagnostica (CID)</label><input style={inp} placeholder="Ex: I20.0" value={hipotese} onChange={e=>setHipotese(e.target.value)} /></div>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                  <input type="checkbox" checked={urgente} onChange={e=>setUrgente(e.target.checked)} /> Marcar como urgente
                </label>
              </div>
            )}

            {tipo === 'encaminhamento' && (
              <div>
                <div style={fld}><label style={lbl}>Tipo</label>
                  <select style={inp} value={tipoEnc} onChange={e=>setTipoEnc(e.target.value)}>
                    <option>Especialista</option><option>TFD</option><option>Hospital</option><option>Contrarreferencia</option>
                  </select>
                </div>
                <div style={fld}><label style={lbl}>Especialidade</label>
                  <select style={inp} value={especialidade} onChange={e=>setEspec(e.target.value)}>
                    <option>Cardiologia</option><option>Neurologia</option><option>Ortopedia</option>
                    <option>Oncologia</option><option>Psiquiatria</option><option>Dermatologia</option>
                  </select>
                </div>
                <div style={fld}><label style={lbl}>Prioridade</label>
                  <select style={inp} value={prioridade} onChange={e=>setPriori(e.target.value)}>
                    <option>Alta</option><option>Media</option><option>Baixa</option>
                  </select>
                </div>
                <div style={fld}><label style={lbl}>Justificativa clinica</label>
                  <textarea style={{...inp, resize:'vertical', minHeight:80}} value={justificativa} onChange={e=>setJustif(e.target.value)} placeholder="Descreva a justificativa clinica..." />
                </div>
              </div>
            )}

          </div>

          {/* Preview */}
          <div style={{ overflowY:'auto', padding:24, background:'#e8ecf0' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textAlign:'center', marginBottom:16, textTransform:'uppercase', letterSpacing:'.06em' }}>
              Previa do documento
            </div>
            <div ref={printRef}>
              <DocPreview tipo={tipo} dados={dados} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}