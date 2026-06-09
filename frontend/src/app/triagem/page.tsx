'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const RISCO = [
  {id:'vermelho',label:'Emergência',tempo:'Imediato',bg:'#ef4444',c:'#fff'},
  {id:'laranja',label:'Muito urgente',tempo:'≤10min',bg:'#f97316',c:'#fff'},
  {id:'amarelo',label:'Urgente',tempo:'≤60min',bg:'#eab308',c:'#422006'},
  {id:'verde',label:'Pouco urgente',tempo:'≤120min',bg:'#22c55e',c:'#fff'},
  {id:'azul',label:'Não urgente',tempo:'≤240min',bg:'#3b82f6',c:'#fff'}
]

const av = (v,min,max,ok,at,al) => !v?'':(+v<min||+v>max)?al:(+v<=ok)?'normal':(+v<=at)?'atencao':'alerta'
const cls = {normal:{b:'#dcfce7',c:'#166534',t:'Normal'},atencao:{b:'#fef9c3',c:'#854d0e',t:'Atenção'},alerta:{b:'#fee2e2',c:'#991b1b',t:'Alerta'},'':{b:'#f1f5f9',c:'#94a3b8',t:'—'}}

export default function TriagemPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [filaTriagem, setFilaTriagem] = useState([])
  const [pac, setPac] = useState(null)
  const [v, setV] = useState({peso:'',altura:'',pas:'',pad:'',temp:'',fc:'',fr:'',sat:'',glic:'',dor:'0'})
  const [risco, setRisco] = useState('')
  const [queixa, setQueixa] = useState('')
  const [ok, setOk] = useState(false)

  // Carregar pacientes da triagem vindos da recepção
  const carregarPacientesTriagem = () => {
    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      const pacientes = JSON.parse(pacientesStorage)
      // Filtrar apenas pacientes que estão aguardando triagem ou em triagem (não finalizados)
      const ativos = pacientes.filter(p => p.status === 'aguardando_triagem' || p.status === 'em_triagem')
      setFilaTriagem(ativos)
    }
  }

  // Função para atualizar status no localStorage
  const atualizarStatusPaciente = (pacienteId, novoStatus, dadosTriagem = null) => {
    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      let pacientes = JSON.parse(pacientesStorage)
      pacientes = pacientes.map(p => {
        if (p.id === pacienteId) {
          const atualizado = { 
            ...p, 
            status: novoStatus,
            ...(dadosTriagem && { dados_triagem: dadosTriagem }),
            data_triagem: new Date().toISOString()
          }
          return atualizado
        }
        return p
      })
      localStorage.setItem('pacientes_triagem', JSON.stringify(pacientes))
      
      // Salvar no histórico de triagens realizadas
      const historicoStorage = localStorage.getItem('historico_triagens')
      const historico = historicoStorage ? JSON.parse(historicoStorage) : []
      const pacienteCompleto = pacientes.find(p => p.id === pacienteId)
      if (pacienteCompleto && novoStatus === 'aguardando_medico') {
        historico.push({
          ...pacienteCompleto,
          dados_triagem: dadosTriagem,
          finalizado_em: new Date().toISOString(),
          enfermeiro: usuario?.nome
        })
        localStorage.setItem('historico_triagens', JSON.stringify(historico))
      }
    }
  }

  useEffect(() => {
    const u = localStorage.getItem('usuario')
    if (!u) {
      router.replace('/login')
      return
    }
    setUsuario(JSON.parse(u))
    carregarPacientesTriagem()
    
    // Adicionar listener para atualizar quando houver mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'pacientes_triagem') {
        carregarPacientesTriagem()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [router])

  if (!usuario) return null

  const set = k => e => setV(p=>({...p,[k]:e.target.value}))
  const imc = v.peso&&v.altura ? (parseFloat(v.peso)/((parseFloat(v.altura)/100)**2)).toFixed(1) : null
  const imcC = imc ? parseFloat(imc)<18.5?'Abaixo do peso':parseFloat(imc)<25?'Normal':parseFloat(imc)<30?'Sobrepeso':'Obesidade' : null
  const stFC = av(v.fc,20,300,100,120,'alerta')
  const stSat = av(v.sat,50,100,100,95,'alerta')===''?'':+v.sat>=95?'normal':+v.sat>=90?'atencao':'alerta'
  const stTemp = v.temp?(+v.temp<35?'alerta':+v.temp<=37.2?'normal':+v.temp<=38.9?'atencao':'alerta'):''
  const stGlic = v.glic?(+v.glic<70?'alerta':+v.glic<=99?'normal':+v.glic<=125?'atencao':'alerta'):''
  const stPA = v.pas&&v.pad?(+v.pas<90||+v.pad<60?'alerta':+v.pas<=120&&+v.pad<=80?'normal':+v.pas<=139?'atencao':'alerta'):''

  function finalizar() {
    // Salvar dados da triagem
    const dadosTriagem = {
      sinais_vitais: v,
      risco: risco,
      queixa: queixa,
      imc: imc,
      imc_classificacao: imcC,
      data_hora: new Date().toISOString(),
      enfermeiro: usuario.nome
    }
    
    // Atualizar status para AGUARDANDO MÉDICO (não remover!)
    if (pac) {
      atualizarStatusPaciente(pac.id, 'aguardando_medico', dadosTriagem)
      carregarPacientesTriagem() // Recarregar a fila (remove apenas os que estão em triagem)
    }
    
    setOk(true)
    setTimeout(() => {
      setOk(false)
      setPac(null)
      setV({peso:'',altura:'',pas:'',pad:'',temp:'',fc:'',fr:'',sat:'',glic:'',dor:'0'})
      setRisco('')
      setQueixa('')
      carregarPacientesTriagem()
    }, 2500)
  }

  const inp = {border:'1.5px solid #e2e8f0',borderRadius:8,padding:'7px 8px',fontSize:14,fontWeight:700,textAlign:'center',outline:'none',width:'100%',fontFamily:'inherit'}
  const lbl = {fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'system-ui',background:'#f1f5f9'}}>
      <aside style={{width:200,background:'#0f172a',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 16px',borderBottom:'1px solid rgba(255,255,255,.07)',fontSize:13,fontWeight:700,color:'#fff'}}>PoliclínicaMed</div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {[{l:'🏠 Recepção',h:'/recepcao'},{l:'🩺 Triagem',h:'/triagem'},{l:'📒 Prontuário',h:'/prontuario'},{l:'📊 Gestão',h:'/gestao'}].map(x=>(
            <div key={x.h} onClick={()=>router.push(x.h)} style={{padding:'9px 16px',fontSize:12,color:x.h==='/triagem'?'#3ECF8E':'#64748b',fontWeight:x.h==='/triagem'?700:400,cursor:'pointer',borderLeft:x.h==='/triagem'?'3px solid #3ECF8E':'3px solid transparent'}}>{x.l}</div>
          ))}
        </nav>
        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,.07)',fontSize:11,color:'#475569',cursor:'pointer'}} onClick={()=>{localStorage.clear();router.push('/login')}}>↩ Sair</div>
      </aside>
      
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Lista de pacientes da triagem */}
        <div style={{width:260,background:'#fff',borderRight:'1px solid #e2e8f0',overflowY:'auto',padding:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>🩺 Fila de triagem</div>
            <div style={{fontSize:11,color:'#94a3b8',background:'#f1f5f9',padding:'2px 8px',borderRadius:12}}>
              {filaTriagem.length} pacientes
            </div>
          </div>
          
          {filaTriagem.length === 0 && (
            <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>
              <div style={{fontSize:32,marginBottom:8}}>📭</div>
              <div style={{fontSize:12}}>Nenhum paciente aguardando triagem</div>
            </div>
          )}
          
          {filaTriagem.map(f => (
            <div 
              key={f.id} 
              onClick={() => {
                setPac(f)
                // Marcar como em triagem
                atualizarStatusPaciente(f.id, 'em_triagem')
                carregarPacientesTriagem()
              }} 
              style={{
                padding:'10px 12px',
                borderRadius:10,
                border:'1.5px solid',
                borderColor:pac?.id===f.id?'#3ECF8E':'#e2e8f0',
                background:pac?.id===f.id?'#f0fdf4':'#f8fafc',
                cursor:'pointer',
                marginBottom:8,
                transition:'all .15s',
                position:'relative'
              }}
            >
              <div style={{fontSize:14,fontWeight:800,color:'#3ECF8E',fontFamily:'monospace'}}>#{f.num}</div>
              <div style={{fontSize:13,fontWeight:600,color:'#0f172a',marginTop:2}}>{f.nome}</div>
              <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{f.esp}</div>
              {f.chegada && (
                <div style={{fontSize:9,color:'#cbd5e1',marginTop:4}}>
                  Chegada: {new Date(f.chegada).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
          
          {/* Botão para atualizar manualmente */}
          <button 
            onClick={carregarPacientesTriagem}
            style={{
              width:'100%',
              marginTop:10,
              padding:'8px',
              background:'#f1f5f9',
              border:'1px solid #e2e8f0',
              borderRadius:8,
              fontSize:11,
              cursor:'pointer',
              color:'#64748b'
            }}
          >
            🔄 Atualizar fila
          </button>
        </div>
        
        {/* Área de triagem */}
        <main style={{flex:1,overflowY:'auto',padding:20}}>
          {!pac ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:12,color:'#94a3b8'}}>
              <div style={{fontSize:48}}>🩺</div>
              <div style={{fontSize:15,fontWeight:600}}>Selecione um paciente da fila para iniciar a triagem</div>
              {filaTriagem.length === 0 && (
                <div style={{fontSize:13,textAlign:'center',maxWidth:300,color:'#cbd5e1'}}>
                  Os pacientes aparecerão aqui quando a recepção enviá-los para triagem.
                </div>
              )}
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {ok && <div style={{background:'#dcfce7',border:'1px solid #86efac',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#166534',fontWeight:700}}>✓ Triagem finalizada! Paciente encaminhado ao médico.</div>}
              
              {/* Cabeçalho do paciente */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:16,display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:42,height:42,borderRadius:'50%',background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#2563eb'}}>
                  {pac.nome.split(' ').map(n=>n[0]).slice(0,2).join('')}
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>{pac.nome}</div>
                  <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{pac.esp} · Ficha #{pac.num}</div>
                </div>
              </div>
              
              {/* Sinais vitais */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:18}}>
                <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>⚡ Sinais vitais</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:10}}>
                  {[{k:'peso',l:'Peso',u:'kg'},{k:'altura',l:'Altura',u:'cm'},{k:'fc',l:'Freq. cardíaca',u:'bpm',st:stFC},{k:'sat',l:'Saturação O₂',u:'%',st:stSat}].map(x=>(
                    <div key={x.k} style={{background:'#f8fafc',borderRadius:10,padding:'10px 12px'}}>
                      <label style={lbl}>{x.l}</label>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <input type="number" value={v[x.k]} onChange={set(x.k)} style={{...inp,borderColor:x.st==='alerta'?'#ef4444':x.st==='atencao'?'#eab308':'#e2e8f0'}} />
                        <span style={{fontSize:10,color:'#94a3b8',whiteSpace:'nowrap'}}>{x.u}</span>
                      </div>
                      {x.st && <div style={{marginTop:5,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,display:'inline-block',background:cls[x.st]?.b,color:cls[x.st]?.c}}>{cls[x.st]?.t}</div>}
                    </div>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:10}}>
                  <div style={{background:'#f8fafc',borderRadius:10,padding:'10px 12px'}}>
                    <label style={lbl}>PA (mmHg)</label>
                    <div style={{display:'flex',gap:4,alignItems:'center'}}>
                      <input type="number" value={v.pas} onChange={set('pas')} placeholder="120" style={{...inp,borderColor:stPA==='alerta'?'#ef4444':stPA==='atencao'?'#eab308':'#e2e8f0'}} />
                      <span style={{color:'#94a3b8'}}>/</span>
                      <input type="number" value={v.pad} onChange={set('pad')} placeholder="80" style={{...inp,borderColor:stPA==='alerta'?'#ef4444':stPA==='atencao'?'#eab308':'#e2e8f0'}} />
                    </div>
                    {stPA && <div style={{marginTop:5,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,display:'inline-block',background:cls[stPA]?.b,color:cls[stPA]?.c}}>{stPA==='normal'?'Normal':stPA==='atencao'?'Atenção':'Hipertensão'}</div>}
                  </div>
                  {[{k:'temp',l:'Temperatura',u:'°C',st:stTemp},{k:'glic',l:'Glicemia',u:'mg/dL',st:stGlic},{k:'fr',l:'Freq. resp.',u:'irpm'}].map(x=>(
                    <div key={x.k} style={{background:'#f8fafc',borderRadius:10,padding:'10px 12px'}}>
                      <label style={lbl}>{x.l}</label>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <input type="number" value={v[x.k]} onChange={set(x.k)} style={{...inp,borderColor:x.st==='alerta'?'#ef4444':x.st==='atencao'?'#eab308':'#e2e8f0'}} />
                        <span style={{fontSize:10,color:'#94a3b8',whiteSpace:'nowrap'}}>{x.u}</span>
                      </div>
                      {x.st && <div style={{marginTop:5,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,display:'inline-block',background:cls[x.st]?.b,color:cls[x.st]?.c}}>{cls[x.st]?.t}</div>}
                    </div>
                  ))}
                </div>
                {imc && <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'10px 14px',display:'flex',gap:10,alignItems:'center'}}><span style={{fontSize:11,color:'#64748b',fontWeight:600}}>IMC:</span><span style={{fontSize:20,fontWeight:800,color:'#166534'}}>{imc}</span><span style={{fontSize:12,color:'#64748b'}}>kg/m² — {imcC}</span></div>}
                <div style={{marginTop:12}}>
                  <label style={lbl}>Escala de dor: <strong style={{color:'#0f172a',fontSize:14}}>{v.dor}/10</strong></label>
                  <input type="range" min={0} max={10} value={v.dor} onChange={set('dor')} style={{width:'100%',accentColor:'#3ECF8E'}} />
                </div>
              </div>
              
              {/* Classificação de risco */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:18}}>
                <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>🚦 Classificação de risco — Manchester</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {RISCO.map(r=>(
                    <button key={r.id} onClick={()=>setRisco(r.id)} style={{flex:1,minWidth:100,padding:'10px 6px',borderRadius:10,border:'2px solid '+(risco===r.id?r.bg:'#e2e8f0'),background:risco===r.id?r.bg:'#f8fafc',cursor:'pointer',transition:'all .15s'}}>
                      <div style={{fontSize:11,fontWeight:700,color:risco===r.id?r.c:'#0f172a'}}>{r.label}</div>
                      <div style={{fontSize:10,color:risco===r.id?r.c:'#94a3b8',marginTop:2}}>{r.tempo}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Queixa principal */}
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:18}}>
                <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>📝 Queixa principal</div>
                <textarea value={queixa} onChange={e=>setQueixa(e.target.value)} placeholder="Descreva a queixa principal do paciente..." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:13,resize:'vertical',minHeight:72,outline:'none',fontFamily:'inherit'}} />
              </div>
              
              <button onClick={finalizar} style={{padding:14,background:'#3ECF8E',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer'}}>
                ✓ Finalizar triagem e encaminhar ao médico
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}