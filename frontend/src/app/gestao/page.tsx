'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const PROD = [
  { nome:'Dr. Roberto Nunes',  esp:'Clinica Medica',  consultas:82, meta:80,  pct:103 },
  { nome:'Dra. Fernanda Lima', esp:'Pediatria',        consultas:50, meta:50,  pct:100 },
  { nome:'Dr. Carlos Mendes',  esp:'Cardiologia',      consultas:56, meta:60,  pct:93  },
  { nome:'Dra. Carla Souza',   esp:'Ginecologia',      consultas:43, meta:50,  pct:86  },
  { nome:'Dr. Marcos Silva',   esp:'Ortopedia',        consultas:37, meta:40,  pct:93  },
  { nome:'Dr. Paulo Mendes',   esp:'Neurologia',       consultas:27, meta:40,  pct:68  },
]

const ESPS = [
  { esp:'Clinica Medica', val:82, cor:'#185FA5' },
  { esp:'Cardiologia',    val:56, cor:'#378ADD' },
  { esp:'Pediatria',      val:50, cor:'#0F6E56' },
  { esp:'Ginecologia',    val:43, cor:'#993556' },
  { esp:'Ortopedia',      val:37, cor:'#3B6D11' },
  { esp:'Neurologia',     val:27, cor:'#854F0B' },
  { esp:'Demais',         val:52, cor:'#A8B3C4' },
]

const ABAS = [
  { id:'dashboard',  l:'Dashboard'  },
  { id:'producao',   l:'Producao'   },
  { id:'bpa',        l:'BPA'        },
  { id:'apac',       l:'APAC'       },
  { id:'relatorios', l:'Relatorios' },
]

const BPA_DATA = [
  { cbo:'225120', proc:'Consulta Clinica Medica', cid:'I10',   qtd:82, status:'Validado', cor:'#dcfce7', corT:'#166534' },
  { cbo:'225125', proc:'Consulta Cardiologia',    cid:'I20.0', qtd:56, status:'Validado', cor:'#dcfce7', corT:'#166534' },
  { cbo:'225133', proc:'Consulta Pediatria',      cid:'J18',   qtd:50, status:'Pendente', cor:'#fef9c3', corT:'#854d0e' },
  { cbo:'225145', proc:'Consulta Ginecologia',    cid:'N94',   qtd:43, status:'Validado', cor:'#dcfce7', corT:'#166534' },
  { cbo:'225150', proc:'Consulta Ortopedia',      cid:'M54',   qtd:37, status:'Pendente', cor:'#fef9c3', corT:'#854d0e' },
]

const APAC_DATA = [
  { num:'350001/26', pac:'Maria Silva',   proc:'Cateterismo cardiaco', cid:'I20.0', val:'30/06/2026', status:'Aprovada',   cor:'#dcfce7', corT:'#166534' },
  { num:'350002/26', pac:'Jose Almeida', proc:'Dialise peritoneal',   cid:'N18.5', val:'31/07/2026', status:'Em analise', cor:'#dbeafe', corT:'#1d4ed8' },
  { num:'350003/26', pac:'Ana Ferreira', proc:'Quimioterapia',        cid:'C50.9', val:'31/08/2026', status:'Aprovada',   cor:'#dcfce7', corT:'#166534' },
  { num:'350004/26', pac:'Carlos Mota',  proc:'Ressonancia coluna',   cid:'M51.1', val:'15/06/2026', status:'Vencida',    cor:'#fee2e2', corT:'#991b1b' },
]

const maxVal = Math.max(...ESPS.map(e => e.val))

const th = { fontSize:10, fontWeight:700 as const, color:'#64748b', textAlign:'left' as const, padding:'8px 10px', textTransform:'uppercase' as const, letterSpacing:'.04em' }
const td = { padding:'10px', fontSize:12, color:'#0f172a', borderBottom:'1px solid #f1f5f9' }

export default function GestaoPage() {
  const router = useRouter()
  const [aba, setAba]       = useState('dashboard')
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) { router.replace('/login'); return }
    setUsuario(JSON.parse(u))
  }, [router])

  if (!usuario) return null

  const pctCor = (p: number) => p >= 100 ? { bg:'#dcfce7', c:'#166534' } : p >= 85 ? { bg:'#fef9c3', c:'#854d0e' } : { bg:'#fee2e2', c:'#991b1b' }

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'system-ui', background:'#f1f5f9' }}>

      {/* Sidebar */}
      <aside style={{ width:200, background:'#0f172a', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,.07)', fontSize:13, fontWeight:700, color:'#fff' }}>PoliclinicaMed</div>
        <nav style={{ flex:1, padding:'10px 0' }}>
          {[{l:'Recepcao',h:'/recepcao'},{l:'Triagem',h:'/triagem'},{l:'Gestao',h:'/gestao'}].map(x => (
            <div key={x.h} onClick={() => router.push(x.h)}
              style={{ padding:'9px 16px', fontSize:12, cursor:'pointer',
                color: x.h==='/gestao' ? '#f59e0b' : '#64748b',
                fontWeight: x.h==='/gestao' ? 700 : 400,
                borderLeft: x.h==='/gestao' ? '3px solid #f59e0b' : '3px solid transparent' }}>
              {x.h==='/recepcao'?'🏠':x.h==='/triagem'?'🩺':'📊'} {x.l}
            </div>
          ))}
        </nav>
        <div onClick={() => { localStorage.clear(); router.push('/login') }}
          style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.07)', fontSize:11, color:'#475569', cursor:'pointer' }}>
          Sair
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Topbar */}
        <header style={{ height:52, background:'#fff', borderBottom:'1px solid #e2e8f0',
          display:'flex', alignItems:'center', padding:'0 20px', gap:8, flexShrink:0 }}>
          <div style={{ flex:1, fontSize:14, fontWeight:700, color:'#0f172a' }}>Painel Administrativo</div>
          <button style={{ padding:'6px 14px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, cursor:'pointer', color:'#64748b' }}>Excel</button>
          <button style={{ padding:'6px 14px', background:'#185FA5', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', color:'#fff' }}>PDF</button>
        </header>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0', background:'#fff', padding:'0 20px' }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              style={{ padding:'10px 16px', fontSize:12, fontWeight:600, border:'none', background:'none', cursor:'pointer',
                borderBottom:'2px solid '+(aba===a.id?'#185FA5':'transparent'),
                color: aba===a.id ? '#185FA5' : '#64748b' }}>
              {a.l}
            </button>
          ))}
        </div>

        <main style={{ flex:1, overflowY:'auto', padding:20 }}>

          {/* DASHBOARD */}
          {aba === 'dashboard' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[
                  { l:'Consultas no mes', v:'347', sub:'+12% vs maio', cor:'#185FA5' },
                  { l:'Tempo medio espera', v:'18 min', sub:'-4min vs maio', cor:'#3ECF8E' },
                  { l:'Taxa absenteismo', v:'8%', sub:'Acima da meta', cor:'#f59e0b' },
                  { l:'Especialidades ativas', v:'6', sub:'Estavel', cor:'#8b5cf6' },
                ].map(k => (
                  <div key={k.l} style={{ background:'#fff', borderRadius:12, padding:'16px 18px', border:'1px solid #e2e8f0' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>{k.l}</div>
                    <div style={{ fontSize:28, fontWeight:800, color:k.cor, lineHeight:1 }}>{k.v}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {/* Grafico especialidades */}
                <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:18 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Consultas por especialidade</div>
                  {ESPS.map(e => (
                    <div key={e.esp} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                      <div style={{ fontSize:11, color:'#64748b', width:110, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.esp}</div>
                      <div style={{ flex:1, height:10, background:'#f1f5f9', borderRadius:5, overflow:'hidden' }}>
                        <div style={{ width:(e.val/maxVal*100)+'%', height:'100%', background:e.cor, borderRadius:5 }} />
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#0f172a', minWidth:24, textAlign:'right' }}>{e.val}</div>
                    </div>
                  ))}
                </div>

                {/* Producao */}
                <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:18 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Producao por profissional</div>
                  {PROD.map(p => {
                    const c = pctCor(p.pct)
                    return (
                      <div key={p.nome} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, padding:'8px 10px', background:'#f8fafc', borderRadius:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{p.nome.split(' ').slice(0,2).join(' ')}</div>
                          <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{p.esp}</div>
                        </div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{p.consultas}</div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:c.bg, color:c.c }}>{p.pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCAO */}
          {aba === 'producao' && (
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16 }}>Producao detalhada — Junho 2026</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #e2e8f0' }}>
                    {['Profissional','Especialidade','Consultas','Meta','% Meta','T. medio'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PROD.map(p => {
                    const c = pctCor(p.pct)
                    return (
                      <tr key={p.nome}>
                        <td style={{ ...td, fontWeight:600 }}>{p.nome}</td>
                        <td style={td}>{p.esp}</td>
                        <td style={{ ...td, fontWeight:700 }}>{p.consultas}</td>
                        <td style={td}>{p.meta}</td>
                        <td style={td}><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:c.bg, color:c.c }}>{p.pct}%</span></td>
                        <td style={td}>22 min</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* BPA */}
          {aba === 'bpa' && (
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16 }}>BPA — Boletim de Producao Ambulatorial</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #e2e8f0' }}>
                    {['CBO','Procedimento','CID','Qtd','Competencia','Status'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {BPA_DATA.map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontFamily:'monospace', color:'#185FA5' }}>{r.cbo}</td>
                      <td style={td}>{r.proc}</td>
                      <td style={{ ...td, fontFamily:'monospace', color:'#64748b' }}>{r.cid}</td>
                      <td style={{ ...td, fontWeight:700 }}>{r.qtd}</td>
                      <td style={td}>06/2026</td>
                      <td style={td}><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:r.cor, color:r.corT }}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* APAC */}
          {aba === 'apac' && (
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16 }}>APAC — Procedimentos de Alto Custo</div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #e2e8f0' }}>
                    {['Nr APAC','Paciente','Procedimento','CID','Validade','Status'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {APAC_DATA.map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontFamily:'monospace', color:'#185FA5', fontSize:11 }}>{r.num}</td>
                      <td style={{ ...td, fontWeight:600 }}>{r.pac}</td>
                      <td style={td}>{r.proc}</td>
                      <td style={{ ...td, fontFamily:'monospace', color:'#64748b' }}>{r.cid}</td>
                      <td style={td}>{r.val}</td>
                      <td style={td}><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:r.cor, color:r.corT }}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* RELATORIOS */}
          {aba === 'relatorios' && (
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16 }}>Exportar relatorios</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
                {['Producao individual','Por profissional','Por periodo','BPA consolidado','APAC vigentes','Absenteismo'].map(r => (
                  <button key={r}
                    style={{ padding:'20px 16px', background:'#f8fafc', border:'1px solid #e2e8f0',
                      borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#374151' }}>
                    {r}
                  </button>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button style={{ padding:13, background:'#3B6D11', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Exportar em Excel
                </button>
                <button style={{ padding:13, background:'#185FA5', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Exportar em PDF
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}