'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const PACIENTE = {
  nome: 'Joao Santos', nascimento: '14/03/1988', idade: 38,
  sexo: 'Masculino', cns: '700 0000 0000 0016', cpf: '987.654.321-00',
  municipio: 'Alto Alegre do Maranhao', telefone: '(99) 98765-4321',
  especialidade: 'Clinica Medica', medico: 'Dr. Roberto Nunes',
  consultorio: 'Consultorio 01', ficha: '016',
}

const VITAIS = [
  { l:'Pressao arterial', v:'148/92', u:'mmHg', st:'alerta',  stT:'Hipertensao' },
  { l:'Freq. cardiaca',   v:'98',     u:'bpm',  st:'normal',  stT:'Normal'      },
  { l:'Temperatura',      v:'36.8',   u:'C',    st:'normal',  stT:'Normal'      },
  { l:'Saturacao O2',     v:'96',     u:'%',    st:'normal',  stT:'Normal'      },
  { l:'IMC',              v:'28.4',   u:'kg/m2',st:'atencao', stT:'Sobrepeso'   },
  { l:'Glicemia',         v:'132',    u:'mg/dL',st:'atencao', stT:'Atencao'     },
  { l:'Dor (0-10)',        v:'6',      u:'/10',  st:'atencao', stT:'Moderada'    },
  { l:'Peso / Altura',    v:'82kg/170cm',u:'',  st:'normal',  stT:''            },
]

const ST_COR: Record<string,{bg:string;c:string}> = {
  normal:  { bg:'#dcfce7', c:'#166534' },
  atencao: { bg:'#fef9c3', c:'#854d0e' },
  alerta:  { bg:'#fee2e2', c:'#991b1b' },
}

const CIDS_INIT = [
  { id:'1', codigo:'I20.0', desc:'Angina instavel',                tipo:'principal'  },
  { id:'2', codigo:'I10',   desc:'Hipertensao essencial',          tipo:'secundario' },
  { id:'3', codigo:'E78.5', desc:'Hiperlipidemia nao especificada',tipo:'secundario' },
]

const DOCS = [
  { l:'Receituario simples', cor:'#185FA5', bg:'#E6F1FB' },
  { l:'Controle especial',   cor:'#185FA5', bg:'#E6F1FB' },
  { l:'Solicitar exames',    cor:'#3B6D11', bg:'#EAF3DE' },
  { l:'Atestado medico',     cor:'#854F0B', bg:'#FAEEDA' },
  { l:'Declaracao',          cor:'#854F0B', bg:'#FAEEDA' },
  { l:'Encaminhamento',      cor:'#993556', bg:'#FBEAF0' },
  { l:'Laudo APAC',          cor:'#5F5E5A', bg:'#F1EFE8' },
]

const ABAS = [
  { id:'anamnese',    l:'1 — Anamnese'       },
  { id:'exame',       l:'2 — Exame Fisico'   },
  { id:'resultados',  l:'3 — Resultados'     },
  { id:'diagnostico', l:'4 — Diagnosticos'   },
  { id:'conduta',     l:'5 — Conduta'        },
  { id:'encaminh',    l:'6 — Encaminhamentos'},
]

export default function ProntuarioPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [aba, setAba]         = useState('anamnese')
  const [salvo, setSalvo]     = useState(false)
  const [cids, setCids]       = useState(CIDS_INIT)
  const [novoCid, setNovoCid] = useState({ codigo:'', desc:'', tipo:'principal' })

  const [queixa,  setQueixa]  = useState('Dor toracica ha 2 dias, tipo pressao, irradiando para o braco esquerdo')
  const [hda,     setHda]     = useState('Paciente refere dor precordial ha 2 dias, inicio subito, intensidade 6/10. Relata melhora ao repouso.')
  const [antPes,  setAntPes]  = useState('HAS ha 5 anos em uso de losartana. Dislipidemia em 2022.')
  const [antFam,  setAntFam]  = useState('Pai: IAM aos 55 anos. Mae: DM tipo 2, HAS.')
  const [habitos, setHabitos] = useState('Ex-tabagista. Sedentario. Dieta hipercalorica.')
  const [alergias,setAlergias]= useState('AAS (urticaria).')
  const [meds,    setMeds]    = useState('Losartana 50mg/dia. Atorvastatina 20mg/noite.')
  const [egeral,  setEgeral]  = useState('Regular estado geral, corado, hidratado.')
  const [cardio,  setCardio]  = useState('RCR 2T, B1 e B2 normais, sem sopros.')
  const [resp,    setResp]    = useState('MV presente bilateralmente, sem ruidos.')
  const [abd,     setAbd]     = useState('Plano, RHA presentes, indolor a palpacao.')
  const [neuro,   setNeuro]   = useState('Glasgow 15. Orientado. Sem deficits motores.')
  const [trat,    setTrat]    = useState('1. Solicitar ECG e troponina seriada.\n2. Manutencao de losartana 50mg/dia.\n3. Atorvastatina 40mg/noite.')
  const [orient,  setOrient]  = useState('Repouso relativo. Dieta hipossodica. Retornar se dor piorar.')
  const [retorno, setRetorno] = useState('7 dias')

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.replace('/login'); return }
    setUsuario(JSON.parse(u))
  }, [router])

  if (!usuario) return null

  function salvar() { setSalvo(true); setTimeout(() => setSalvo(false), 2500) }
  function addCid() {
    if (!novoCid.codigo || !novoCid.desc) return
    setCids(c => [...c, { ...novoCid, id: Date.now().toString() }])
    setNovoCid({ codigo:'', desc:'', tipo:'principal' })
  }

  const inp:any = { width:'100%', padding:'8px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const ta:any  = { ...inp, resize:'vertical', minHeight:68 }
  const lbl:any = { fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:4 }
  const fld:any = { display:'flex', flexDirection:'column', gap:3, marginBottom:12 }
  const sec:any = { background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:18, marginBottom:14 }

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'system-ui', background:'#f1f5f9' }}>

      <aside style={{ width:60, background:'#0f172a', display:'flex', flexDirection:'column', alignItems:'center', padding:'14px 0', gap:6, flexShrink:0 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:'#3ECF8E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', fontWeight:700, marginBottom:10 }}>+</div>
        {[{e:'🏠',h:'/recepcao'},{e:'🩺',h:'/triagem'},{e:'📒',h:'/prontuario'},{e:'📊',h:'/gestao'}].map(x => (
          <div key={x.h} onClick={() => router.push(x.h)}
            style={{ width:40, height:40, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18, cursor:'pointer', background: x.h==='/prontuario'?'rgba(236,72,153,.25)':'transparent' }}>
            {x.e}
          </div>
        ))}
        <div style={{ marginTop:'auto', cursor:'pointer', fontSize:18, color:'#475569' }}
          onClick={() => { localStorage.clear(); router.push('/login') }}>↩</div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        <header style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 20px', height:52,
          display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#FBEAF0',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#993556' }}>JS</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{PACIENTE.nome}</div>
              <div style={{ fontSize:11, color:'#64748b' }}>{PACIENTE.idade} anos · {PACIENTE.sexo} · {PACIENTE.especialidade} · Ficha #{PACIENTE.ficha}</div>
            </div>
          </div>
          <button style={{ padding:'6px 12px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, cursor:'pointer', color:'#64748b' }}>Historico</button>
          <button style={{ padding:'6px 12px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, cursor:'pointer', color:'#64748b' }}>Imprimir</button>
          <button onClick={salvar}
            style={{ padding:'6px 14px', background: salvo?'#3B6D11':'#3ECF8E', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .2s' }}>
            {salvo ? 'Salvo!' : 'Salvar'}
          </button>
        </header>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            <div style={{ display:'flex', background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 16px', overflowX:'auto', flexShrink:0 }}>
              {ABAS.map(a => (
                <button key={a.id} onClick={() => setAba(a.id)}
                  style={{ padding:'10px 14px', fontSize:12, fontWeight:600, border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap',
                    borderBottom:'2px solid '+(aba===a.id?'#ec4899':'transparent'),
                    color: aba===a.id?'#ec4899':'#64748b' }}>
                  {a.l}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:18 }}>

              {aba === 'anamnese' && (
                <div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Queixa e historia da doenca atual</div>
                    <div style={fld}><label style={lbl}>Queixa principal</label><input style={inp} value={queixa} onChange={e=>setQueixa(e.target.value)} /></div>
                    <div style={fld}><label style={lbl}>HDA</label><textarea style={ta} value={hda} onChange={e=>setHda(e.target.value)} /></div>
                  </div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Antecedentes e habitos</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div style={fld}><label style={lbl}>Antecedentes pessoais</label><textarea style={ta} value={antPes} onChange={e=>setAntPes(e.target.value)} /></div>
                      <div style={fld}><label style={lbl}>Antecedentes familiares</label><textarea style={ta} value={antFam} onChange={e=>setAntFam(e.target.value)} /></div>
                      <div style={fld}><label style={lbl}>Habitos de vida</label><textarea style={ta} value={habitos} onChange={e=>setHabitos(e.target.value)} /></div>
                      <div style={fld}><label style={lbl}>Alergias</label><textarea style={ta} value={alergias} onChange={e=>setAlergias(e.target.value)} /></div>
                      <div style={{ ...fld, gridColumn:'span 2' }}><label style={lbl}>Medicamentos em uso</label><textarea style={ta} value={meds} onChange={e=>setMeds(e.target.value)} /></div>
                    </div>
                  </div>
                </div>
              )}

              {aba === 'exame' && (
                <div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Sinais vitais — importados da triagem</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                      {VITAIS.map(vt => {
                        const c = ST_COR[vt.st] || ST_COR.normal
                        return (
                          <div key={vt.l} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                            <div style={{ fontSize:10, color:'#64748b', marginBottom:4 }}>{vt.l}</div>
                            <div style={{ fontSize:17, fontWeight:700, color:'#0f172a' }}>{vt.v}</div>
                            <div style={{ fontSize:10, color:'#94a3b8' }}>{vt.u}</div>
                            {vt.stT && <div style={{ marginTop:4, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, display:'inline-block', background:c.bg, color:c.c }}>{vt.stT}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Exame fisico por sistemas</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div style={fld}><label style={lbl}>Estado geral</label><textarea style={ta} value={egeral} onChange={e=>setEgeral(e.target.value)} /></div>
                      <div style={fld}><label style={lbl}>Aparelho cardiovascular</label><textarea style={ta} value={cardio} onChange={e=>setCardio(e.target.value)} /></div>
                      <div style={fld}><label style={lbl}>Aparelho respiratorio</label><textarea style={ta} value={resp} onChange={e=>setResp(e.target.value)} /></div>
                      <div style={fld}><label style={lbl}>Abdome</label><textarea style={ta} value={abd} onChange={e=>setAbd(e.target.value)} /></div>
                      <div style={fld}><label style={lbl}>Neurologico</label><textarea style={ta} value={neuro} onChange={e=>setNeuro(e.target.value)} /></div>
                    </div>
                  </div>
                </div>
              )}

              {aba === 'resultados' && (
                <div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Enviar resultado de exame</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
                      <div style={fld}><label style={lbl}>Tipo</label>
                        <select style={inp}><option>Laboratorial</option><option>Ultrassonografia</option><option>Raio-X</option><option>Tomografia</option><option>ECG</option></select>
                      </div>
                      <div style={fld}><label style={lbl}>Data</label><input type="date" style={inp} /></div>
                      <div style={fld}><label style={lbl}>Arquivo</label><input style={inp} placeholder="Selecionar arquivo..." /></div>
                    </div>
                    <button style={{ padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Enviar resultado</button>
                  </div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Historico de exames</div>
                    {[{nome:'Eletrocardiograma (ECG)',data:'28/05/2026',tipo:'ECG'},{nome:'Hemograma completo',data:'20/05/2026',tipo:'Lab'},{nome:'Raio-X de torax',data:'15/04/2026',tipo:'Imagem'}].map((e,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', marginBottom:8 }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:'#EAF3DE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>📋</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{e.nome}</div>
                          <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{e.data}</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#E6F1FB', color:'#185FA5' }}>{e.tipo}</span>
                        <button style={{ padding:'4px 10px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, fontSize:11, cursor:'pointer', color:'#64748b' }}>Ver</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aba === 'diagnostico' && (
                <div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Adicionar diagnostico CID-10</div>
                    <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 110px auto', gap:10, alignItems:'flex-end' }}>
                      <div style={fld}><label style={lbl}>Codigo CID</label><input style={inp} placeholder="I20.0" value={novoCid.codigo} onChange={e=>setNovoCid(p=>({...p,codigo:e.target.value}))} /></div>
                      <div style={fld}><label style={lbl}>Descricao</label><input style={inp} placeholder="Angina instavel" value={novoCid.desc} onChange={e=>setNovoCid(p=>({...p,desc:e.target.value}))} /></div>
                      <div style={fld}><label style={lbl}>Tipo</label>
                        <select style={inp} value={novoCid.tipo} onChange={e=>setNovoCid(p=>({...p,tipo:e.target.value}))}>
                          <option value="principal">Principal</option>
                          <option value="secundario">Secundario</option>
                        </select>
                      </div>
                      <button onClick={addCid} style={{ padding:'8px 12px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', marginBottom:12 }}>+ Add</button>
                    </div>
                  </div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Diagnosticos registrados</div>
                    {cids.map(c => (
                      <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#f8fafc', borderRadius:8, marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'#185FA5', fontFamily:'monospace', minWidth:56 }}>{c.codigo}</span>
                        <span style={{ flex:1, fontSize:12, color:'#0f172a' }}>{c.desc}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:c.tipo==='principal'?'#E6F1FB':'#F1EFE8', color:c.tipo==='principal'?'#0C447C':'#5F5E5A' }}>
                          {c.tipo==='principal'?'Principal':'Secundario'}
                        </span>
                        <button onClick={() => setCids(cs => cs.filter(x=>x.id!==c.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:14 }}>x</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aba === 'conduta' && (
                <div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Plano terapeutico</div>
                    <div style={fld}><label style={lbl}>Tratamento / Conduta medica</label><textarea style={{ ...ta, minHeight:90 }} value={trat} onChange={e=>setTrat(e.target.value)} /></div>
                    <div style={fld}><label style={lbl}>Orientacoes ao paciente</label><textarea style={{ ...ta, minHeight:90 }} value={orient} onChange={e=>setOrient(e.target.value)} /></div>
                    <div style={fld}><label style={lbl}>Retorno</label>
                      <select style={inp} value={retorno} onChange={e=>setRetorno(e.target.value)}>
                        <option>7 dias</option><option>15 dias</option><option>30 dias</option><option>Conforme exame</option><option>Alta</option>
                      </select>
                    </div>
                  </div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Emissao de documentos</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                      {DOCS.map(d => (
                        <button key={d.l} style={{ padding:'14px 8px', borderRadius:10, border:`1px solid ${d.cor}40`, background:d.bg, cursor:'pointer', fontSize:11, fontWeight:700, color:d.cor }}>{d.l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {aba === 'encaminh' && (
                <div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Novo encaminhamento</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                      <div style={fld}><label style={lbl}>Tipo</label><select style={inp}><option>Especialista</option><option>TFD</option><option>Hospital</option></select></div>
                      <div style={fld}><label style={lbl}>Especialidade</label><select style={inp}><option>Cardiologia</option><option>Neurologia</option><option>Ortopedia</option></select></div>
                      <div style={fld}><label style={lbl}>Prioridade</label><select style={inp}><option>Alta — urgente</option><option>Media</option><option>Baixa</option></select></div>
                      <div style={{ ...fld, gridColumn:'span 3' }}><label style={lbl}>Justificativa clinica</label><textarea style={ta} placeholder="Descreva a justificativa..." /></div>
                    </div>
                    <button style={{ padding:'8px 16px', background:'#185FA5', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Registrar encaminhamento</button>
                  </div>
                  <div style={sec}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Encaminhamentos registrados</div>
                    {[{esp:'Cardiologia',pri:'Alta prioridade',just:'Dor toracica com alteracoes ao ECG.',corP:'#fee2e2',corPT:'#991b1b'},{esp:'Nutricao',pri:'Media prioridade',just:'Dislipidemia e sobrepeso. Orientacao nutricional.',corP:'#dcfce7',corPT:'#166534'}].map((e,i) => (
                      <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', marginBottom:8 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'#FBEAF0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>❤️</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{e.esp}</span>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:e.corP, color:e.corPT }}>{e.pri}</span>
                          </div>
                          <div style={{ fontSize:12, color:'#64748b' }}>{e.just}</div>
                        </div>
                        <button style={{ padding:'4px 10px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, fontSize:11, cursor:'pointer', color:'#64748b', flexShrink:0 }}>Imprimir</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          <div style={{ width:185, background:'#fff', borderLeft:'1px solid #e2e8f0', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Alertas clinicos</div>
              <div style={{ background:'#FAEEDA', borderRadius:8, padding:'8px 10px', fontSize:11, color:'#854F0B', fontWeight:600, marginBottom:6 }}>Alergia a AAS</div>
              <div style={{ background:'#FCEBEB', borderRadius:8, padding:'8px 10px', fontSize:11, color:'#A32D2D', fontWeight:600 }}>PA elevada 148/92</div>
            </div>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Documentos rapidos</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                {['Receita','Exames','Atestado','Decl.'].map(d => (
                  <button key={d} style={{ padding:'8px 4px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, fontSize:10, fontWeight:600, cursor:'pointer', color:'#374151' }}>{d}</button>
                ))}
              </div>
            </div>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Dados do paciente</div>
              {[['CPF',PACIENTE.cpf],['CNS',PACIENTE.cns],['Municipio',PACIENTE.municipio],['Telefone',PACIENTE.telefone],['Medico',PACIENTE.medico]].map(([k,v]) => (
                <div key={k} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase' }}>{k}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#0f172a', marginTop:1 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}