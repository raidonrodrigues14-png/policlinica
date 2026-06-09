'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const FILA_DEMO = [
  { id:'1', num:'016', nome:'Joao Santos',    esp:'Clinica Medica', status:'aguardando_triagem', cons:'Consultorio 01' },
  { id:'2', num:'017', nome:'Ana Rodrigues',  esp:'Pediatria',      status:'aguardando_triagem', cons:'Consultorio 05' },
  { id:'3', num:'018', nome:'Pedro Alves',    esp:'Ortopedia',      status:'aguardando_medico',  cons:'Consultorio 02' },
  { id:'4', num:'019', nome:'Lucia Ferreira', esp:'Ginecologia',    status:'em_triagem',         cons:'Consultorio 04' },
  { id:'5', num:'015', nome:'Maria Silva',    esp:'Cardiologia',    status:'em_atendimento',     cons:'Consultorio 03' },
]

const STATUS_CFG: Record<string,{label:string;bg:string;color:string}> = {
  aguardando_triagem: { label:'Aguard. triagem', bg:'#fef9c3', color:'#854d0e' },
  em_triagem:         { label:'Em triagem',      bg:'#dbeafe', color:'#1d4ed8' },
  aguardando_medico:  { label:'Aguard. medico',  bg:'#fef3c7', color:'#92400e' },
  em_atendimento:     { label:'Em atendimento',  bg:'#dcfce7', color:'#166534' },
  finalizado:         { label:'Finalizado',      bg:'#f0fdf4', color:'#15803d' },
}

const PROX_STATUS: Record<string,string> = {
  aguardando_triagem: 'em_triagem',
  em_triagem:         'aguardando_medico',
  aguardando_medico:  'em_atendimento',
  em_atendimento:     'finalizado',
}

export default function RecepcaoPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [aba, setAba]         = useState<'fila'|'cadastro'|'painel'>('fila')
  const [fila, setFila]       = useState(FILA_DEMO)
  const [form, setForm]       = useState({ nome:'', cpf:'', nascimento:'', sexo:'M', municipio:'', especialidade:'' })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg]           = useState('')
  const [sidebarAberta, setSidebar] = useState(true)

  // Painel TV
  const [chamadaAtual, setChamadaAtual]   = useState<any>(null)
  const [historico, setHistorico]         = useState<any[]>([])
  const [hora, setHora]                   = useState('')
  const [pisc, setPisc]                   = useState(false)
  const [autoMode, setAutoMode]           = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.replace('/login'); return }
    setUsuario(JSON.parse(u))
  }, [router])

  useEffect(() => {
    const t = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!autoMode) return
    const aguardando = fila.filter(f => f.status === 'aguardando_triagem' || f.status === 'aguardando_medico')
    if (aguardando.length === 0) return
    const t = setInterval(() => {
      chamarPaciente(aguardando[0])
    }, 12000)
    return () => clearInterval(t)
  }, [autoMode, fila])

  if (!usuario) return null

  const aguardando  = fila.filter(f => ['aguardando_triagem','aguardando_medico'].includes(f.status)).length
  const atendimento = fila.filter(f => f.status === 'em_atendimento').length
  const triagem     = fila.filter(f => f.status === 'em_triagem').length
  const finalizados = fila.filter(f => f.status === 'finalizado').length

  function avancarStatus(id: string) {
    setFila(f => f.map(item =>
      item.id === id ? { ...item, status: PROX_STATUS[item.status] || item.status } : item
    ))
  }

  function chamarPaciente(paciente: any) {
    setChamadaAtual(paciente)
    setHistorico(h => [paciente, ...h].slice(0, 5))
    setPisc(true)
    setTimeout(() => setPisc(false), 1500)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(`${paciente.nome}, dirija-se ao ${paciente.cons}.`)
      u.lang = 'pt-BR'
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
    avancarStatus(paciente.id)
  }

  async function salvarPaciente(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true)
    await new Promise(r => setTimeout(r, 800))
    const nova = {
      id: String(Date.now()), num: String(20 + fila.length).padStart(3,'0'),
      nome: form.nome, esp: form.especialidade || 'Clinica Medica',
      status: 'aguardando_triagem', cons: 'Aguardando sala'
    }
    setFila(f => [...f, nova])
    setMsg(`Paciente ${form.nome} cadastrado! Ficha #${nova.num} emitida.`)
    setForm({ nome:'', cpf:'', nascimento:'', sexo:'M', municipio:'', especialidade:'' })
    setSalvando(false)
    setTimeout(() => { setMsg(''); setAba('fila') }, 3000)
  }

  const cor    = { recepcionista:'#22c55e', enfermeiro:'#3b82f6', medico:'#ec4899', gestor:'#f59e0b' }[usuario.perfil] || '#3ECF8E'
  const ini    = usuario.nome.split(' ').map((n:string) => n[0]).slice(0,2).join('')
  const inp:any = { padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, width:'100%', outline:'none', fontFamily:'inherit' }
  const lbl:any = { fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4, letterSpacing:'.03em' }

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:"system-ui", background:'#f1f5f9' }}>

      {/* SIDEBAR */}
      <aside style={{ width: sidebarAberta ? 220 : 60, background:'#0f172a', display:'flex',
        flexDirection:'column', transition:'width .2s', flexShrink:0 }}>
        <div style={{ padding: sidebarAberta ? '18px 18px 14px' : '18px 10px 14px',
          borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'#3ECF8E', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff' }}>+</div>
          {sidebarAberta && <div style={{ fontSize:13, fontWeight:600, color:'#fff', whiteSpace:'nowrap' }}>PoliclinicaMed</div>}
        </div>
        <nav style={{ flex:1, padding:'10px 0' }}>
          {[{l:'Recepcao',h:'/recepcao',e:'🏠'},{l:'Triagem',h:'/triagem',e:'🩺'},{l:'Prontuario',h:'/prontuario',e:'📒'},{l:'Gestao',h:'/gestao',e:'📊'}].map(x => (
            <div key={x.h} onClick={() => router.push(x.h)}
              style={{ display:'flex', alignItems:'center', gap:10,
                padding: sidebarAberta ? '9px 18px' : '9px', justifyContent: sidebarAberta ? 'flex-start' : 'center',
                color: x.h==='/recepcao' ? '#fff' : '#64748b',
                background: x.h==='/recepcao' ? `${cor}25` : 'transparent',
                borderLeft: x.h==='/recepcao' ? `3px solid ${cor}` : '3px solid transparent',
                fontSize:13, fontWeight: x.h==='/recepcao' ? 600 : 400, cursor:'pointer', transition:'all .15s' }}>
              <span style={{ fontSize:17 }}>{x.e}</span>
              {sidebarAberta && <span>{x.l}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: sidebarAberta ? '12px 16px' : '12px 10px',
          borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:cor, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>{ini}</div>
          {sidebarAberta && (
            <>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{usuario.nome.split(' ')[0]}</div>
                <div style={{ fontSize:9, color:'#475569', textTransform:'capitalize' }}>{usuario.perfil}</div>
              </div>
              <button onClick={() => { localStorage.clear(); router.push('/login') }}
                style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:16 }}>↩</button>
            </>
          )}
        </div>
      </aside>

      {/* CONTEUDO */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* TOPBAR */}
        <header style={{ height:52, background:'#fff', borderBottom:'1px solid #e2e8f0',
          display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0 }}>
          <button onClick={() => setSidebar(o => !o)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#64748b' }}>☰</button>
          <div style={{ flex:1, fontSize:14, fontWeight:700, color:'#0f172a' }}>Recepcao</div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>
            {new Date().toLocaleDateString('pt-BR',{ weekday:'long', day:'numeric', month:'long' })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#3ECF8E', fontWeight:600 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#3ECF8E' }} /> Online
          </div>
        </header>

        <main style={{ flex:1, overflowY:'auto', padding:20 }}>

          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            {[
              { label:'Aguardando', valor: aguardando, cor:'#f59e0b' },
              { label:'Em triagem',  valor: triagem,    cor:'#3b82f6' },
              { label:'Atendimento', valor: atendimento,cor:'#3ECF8E' },
              { label:'Finalizados', valor: finalizados, cor:'#8b5cf6' },
            ].map((k,i) => (
              <div key={i} style={{ background:'#fff', borderRadius:12, padding:'16px 18px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>{k.label}</div>
                <div style={{ fontSize:30, fontWeight:800, color:k.cor, lineHeight:1 }}>{k.valor}</div>
              </div>
            ))}
          </div>

          {/* ABAS */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
            <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0', padding:'0 6px' }}>
              {[
                { id:'fila',    label:'📋 Fila do dia'        },
                { id:'painel',  label:'📺 Painel de Chamadas' },
                { id:'cadastro',label:'➕ Novo paciente'       },
              ].map(tab => (
                <button key={tab.id} onClick={() => setAba(tab.id as any)}
                  style={{ padding:'12px 16px', fontSize:13, fontWeight:600, border:'none', background:'none', cursor:'pointer',
                    borderBottom:'2px solid '+(aba===tab.id?cor:'transparent'),
                    color: aba===tab.id ? cor : '#64748b', transition:'all .15s' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding:20 }}>

              {/* ABA FILA */}
              {aba === 'fila' && (
                <div>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
                    <button onClick={() => setFila([...FILA_DEMO])}
                      style={{ padding:'6px 14px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, cursor:'pointer', color:'#64748b' }}>
                      Atualizar
                    </button>
                  </div>
                  {fila.filter(f => f.status !== 'finalizado').map(f => {
                    const cfg = STATUS_CFG[f.status] || STATUS_CFG.aguardando_triagem
                    const podeGhamar = ['aguardando_triagem','aguardando_medico'].includes(f.status)
                    return (
                      <div key={f.id} style={{ display:'flex', alignItems:'center', gap:12,
                        padding:'12px 16px', background:'#f8fafc', borderRadius:10,
                        border:'1px solid #e2e8f0', marginBottom:8 }}>
                        <div style={{ fontSize:17, fontWeight:800, color:'#3ECF8E', fontFamily:'monospace', minWidth:42 }}>#{f.num}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{f.nome}</div>
                          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{f.esp} · {f.cons}</div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, whiteSpace:'nowrap' }}>
                          {cfg.label}
                        </span>
                        {podeGhamar && (
                          <button onClick={() => { chamarPaciente(f); setAba('painel') }}
                            style={{ padding:'6px 14px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                            📢 Chamar
                          </button>
                        )}
                        <button onClick={() => avancarStatus(f.id)}
                          style={{ padding:'6px 12px', background:'#3ECF8E', color:'#fff', border:'none', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                          Avancar →
                        </button>
                      </div>
                    )
                  })}
                  {fila.filter(f => f.status !== 'finalizado').length === 0 && (
                    <div style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
                      <div style={{ fontSize:14, fontWeight:600 }}>Fila vazia! Todos atendidos.</div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA PAINEL */}
              {aba === 'painel' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16 }}>

                  {/* Chamada atual */}
                  <div>
                    <div style={{ background: pisc?'#0d2548':'#0d1e3a', border:`2px solid ${pisc?'#3ECF8E':'#1e3d6e'}`,
                      borderRadius:14, padding:'24px 28px', marginBottom:16, transition:'all .3s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:'#3ECF8E' }} />
                        <span style={{ fontSize:11, fontWeight:700, color:'#3ECF8E', letterSpacing:'.1em', textTransform:'uppercase' }}>
                          {chamadaAtual ? 'Chamando agora' : 'Aguardando chamada'}
                        </span>
                        <span style={{ marginLeft:'auto', fontSize:14, fontWeight:700, color:'#fff', fontFamily:'monospace' }}>{hora}</span>
                      </div>
                      {chamadaAtual ? (
                        <>
                          <div style={{ fontSize:72, fontWeight:800, color:'#fff', lineHeight:1, fontFamily:'monospace' }}>#{chamadaAtual.num}</div>
                          <div style={{ fontSize:26, fontWeight:700, color:'#fff', marginTop:10 }}>{chamadaAtual.nome}</div>
                          <div style={{ fontSize:16, color:'#3ECF8E', marginTop:6 }}>📍 {chamadaAtual.cons} — {chamadaAtual.esp}</div>
                        </>
                      ) : (
                        <div style={{ fontSize:18, color:'#4a6a8a', marginTop:10 }}>Clique em "Chamar" em um paciente da fila</div>
                      )}
                    </div>

                    {/* Proximos na fila */}
                    <div style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:10, textTransform:'uppercase', letterSpacing:'.05em' }}>
                      Proximos na fila
                    </div>
                    {fila.filter(f => ['aguardando_triagem','aguardando_medico'].includes(f.status)).map((f, i) => (
                      <div key={f.id} style={{ display:'grid', gridTemplateColumns:'60px 1fr auto', gap:12, alignItems:'center',
                        background: i===0?'#f0f9ff':'#f8fafc', border:`1px solid ${i===0?'#bae6fd':'#e2e8f0'}`,
                        borderRadius:10, padding:'10px 14px', marginBottom:8 }}>
                        <div style={{ fontSize:18, fontWeight:800, color:'#3ECF8E', fontFamily:'monospace' }}>#{f.num}</div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{f.nome}</div>
                          <div style={{ fontSize:11, color:'#94a3b8' }}>{f.esp} · {f.cons}</div>
                        </div>
                        <button onClick={() => chamarPaciente(f)}
                          style={{ padding:'6px 14px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          📢 Chamar
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Painel lateral direito */}
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                    {/* Controles */}
                    <div style={{ background:'#0f172a', borderRadius:12, padding:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#4a6a8a', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>Controles</div>
                      <button onClick={() => {
                          const aguard = fila.filter(f => ['aguardando_triagem','aguardando_medico'].includes(f.status))
                          if (aguard.length > 0) chamarPaciente(aguard[0])
                        }}
                        style={{ width:'100%', padding:'10px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', marginBottom:8 }}>
                        📢 Chamar proximo
                      </button>
                      <button onClick={() => setAutoMode(a => !a)}
                        style={{ width:'100%', padding:'10px', background:autoMode?'#0F6E56':'#1a2540', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        Auto: {autoMode?'Ligado ✓':'Desligado'}
                      </button>
                      {autoMode && <div style={{ fontSize:10, color:'#4a6a8a', textAlign:'center', marginTop:6 }}>Chamando automaticamente a cada 12s</div>}
                    </div>

                    {/* Indicadores */}
                    <div style={{ background:'#0f172a', borderRadius:12, padding:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#4a6a8a', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>Indicadores</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        {[{l:'Aguardando',v:aguardando},{l:'Atendimento',v:atendimento},{l:'Finalizados',v:finalizados},{l:'Total',v:fila.length}].map(k=>(
                          <div key={k.l} style={{ background:'#0d1428', borderRadius:8, padding:'10px 12px', border:'1px solid #1a2540' }}>
                            <div style={{ fontSize:9, color:'#4a6a8a', marginBottom:4 }}>{k.l}</div>
                            <div style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Historico */}
                    <div style={{ background:'#0f172a', borderRadius:12, padding:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#4a6a8a', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>Ultimas chamadas</div>
                      {historico.length === 0 && <div style={{ fontSize:12, color:'#4a6a8a', textAlign:'center', padding:10 }}>Nenhuma ainda</div>}
                      {historico.map((p, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'#0d1428', borderRadius:6, border:'1px solid #1a2540', marginBottom:6 }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:600, color:'#5DCAA5', fontFamily:'monospace' }}>#{p.num}</div>
                            <div style={{ fontSize:10, color:'#7a9cc4' }}>{p.nome.split(' ')[0]}</div>
                          </div>
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'#0F6E56', color:'#9FE1CB' }}>Chamado</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA CADASTRO */}
              {aba === 'cadastro' && (
                <div>
                  {msg && <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#166534', fontWeight:600, marginBottom:14 }}>✓ {msg}</div>}
                  <form onSubmit={salvarPaciente}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div style={{ gridColumn:'span 2' }}>
                        <label style={lbl}>Nome completo *</label>
                        <input style={inp} value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} required placeholder="Nome do paciente" />
                      </div>
                      <div>
                        <label style={lbl}>CPF</label>
                        <input style={inp} value={form.cpf} onChange={e=>setForm(f=>({...f,cpf:e.target.value}))} placeholder="000.000.000-00" />
                      </div>
                      <div>
                        <label style={lbl}>Data de nascimento *</label>
                        <input style={inp} type="date" value={form.nascimento} onChange={e=>setForm(f=>({...f,nascimento:e.target.value}))} required />
                      </div>
                      <div>
                        <label style={lbl}>Sexo</label>
                        <select style={inp} value={form.sexo} onChange={e=>setForm(f=>({...f,sexo:e.target.value}))}>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                          <option value="I">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Municipio *</label>
                        <input style={inp} value={form.municipio} onChange={e=>setForm(f=>({...f,municipio:e.target.value}))} required placeholder="Cidade" />
                      </div>
                      <div style={{ gridColumn:'span 2' }}>
                        <label style={lbl}>Especialidade</label>
                        <select style={inp} value={form.especialidade} onChange={e=>setForm(f=>({...f,especialidade:e.target.value}))}>
                          <option value="">Selecionar...</option>
                          {['Clinica Medica','Cardiologia','Pediatria','Neurologia','Ginecologia','Ortopedia','Dermatologia','Psicologia','Nutricao','Fisioterapia'].map(e=>(
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" disabled={salvando}
                      style={{ width:'100%', marginTop:14, padding:'12px', background: salvando?'#94a3b8':'#3ECF8E',
                        color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: salvando?'not-allowed':'pointer' }}>
                      {salvando ? 'Cadastrando...' : 'Cadastrar e encaminhar para triagem'}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}