'use client'
import { useState } from 'react'

type Etapa = 'identificacao' | 'especialidade' | 'horario' | 'confirmacao' | 'sucesso'

const ESPECIALIDADES = [
  { id:'clinica',    nome:'Clinica Medica',    emoji:'🩺', desc:'Consultas gerais e check-up' },
  { id:'cardio',     nome:'Cardiologia',       emoji:'❤️', desc:'Coracao e sistema cardiovascular' },
  { id:'pediatria',  nome:'Pediatria',         emoji:'👶', desc:'Criancas e adolescentes' },
  { id:'gineco',     nome:'Ginecologia',       emoji:'🌸', desc:'Saude da mulher' },
  { id:'ortopedia',  nome:'Ortopedia',         emoji:'🦴', desc:'Ossos, musculos e articulacoes' },
  { id:'neuro',      nome:'Neurologia',        emoji:'🧠', desc:'Sistema nervoso' },
  { id:'dermato',    nome:'Dermatologia',      emoji:'✨', desc:'Pele, cabelo e unhas' },
  { id:'psico',      nome:'Psicologia',        emoji:'💭', desc:'Saude mental e emocional' },
  { id:'nutri',      nome:'Nutricao',          emoji:'🥗', desc:'Alimentacao e dieta' },
  { id:'fisio',      nome:'Fisioterapia',      emoji:'💪', desc:'Reabilitacao e movimento' },
]

const MEDICOS: Record<string,{nome:string;crm:string}[]> = {
  clinica:   [{ nome:'Dr. Roberto Nunes',  crm:'CRM/MA 12345' }],
  cardio:    [{ nome:'Dr. Carlos Mendes',  crm:'CRM/MA 54321' }],
  pediatria: [{ nome:'Dra. Fernanda Lima', crm:'CRM/MA 11111' }],
  gineco:    [{ nome:'Dra. Carla Souza',   crm:'CRM/MA 22222' }],
  ortopedia: [{ nome:'Dr. Marcos Silva',   crm:'CRM/MA 33333' }],
  neuro:     [{ nome:'Dr. Paulo Mendes',   crm:'CRM/MA 44444' }],
  dermato:   [{ nome:'Dra. Ana Pereira',   crm:'CRM/MA 55555' }],
  psico:     [{ nome:'Psi. Lucia Costa',   crm:'CRP/MA 6789'  }],
  nutri:     [{ nome:'Nutr. Rita Campos',  crm:'CRN/MA 1234'  }],
  fisio:     [{ nome:'Ft. Joao Alves',     crm:'CREFITO 5678' }],
}

function gerarHorarios(data: string) {
  const ocupados = ['08:30','10:00','14:00','15:30']
  const slots = []
  for (let h = 7; h < 17; h++) {
    for (const m of [0,30]) {
      const hora = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
      slots.push({ hora, livre: !ocupados.includes(hora) })
    }
  }
  return slots
}

function gerarProtocolo() {
  return Math.random().toString(36).substring(2,10).toUpperCase()
}

export default function AgendarPage() {
  const [etapa, setEtapa]       = useState<Etapa>('identificacao')
  const [nome,  setNome]        = useState('')
  const [cpf,   setCpf]         = useState('')
  const [nasc,  setNasc]        = useState('')
  const [esp,   setEsp]         = useState('')
  const [medico,setMedico]      = useState('')
  const [data,  setData]        = useState('')
  const [hora,  setHora]        = useState('')
  const [proto, setProto]       = useState('')
  const [erro,  setErro]        = useState('')

  const espObj  = ESPECIALIDADES.find(e => e.id === esp)
  const medObj  = MEDICOS[esp]?.[0]
  const horarios = data ? gerarHorarios(data) : []

  const minData = new Date()
  minData.setDate(minData.getDate() + 1)
  const minDataStr = minData.toISOString().slice(0,10)

  function confirmar() {
    const p = gerarProtocolo()
    setProto(p)
    setEtapa('sucesso')
  }

  function formatCPF(v: string) {
    return v.replace(/\D/g,'').slice(0,11)
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
  }

  const btn = (label: string, onClick: ()=>void, disabled=false, cor='#3ECF8E') => (
    <button onClick={onClick} disabled={disabled}
      style={{ width:'100%', padding:'14px', background:disabled?'#cbd5e1':cor,
        color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700,
        cursor:disabled?'not-allowed':'pointer', transition:'all .2s', marginTop:8 }}>
      {label}
    </button>
  )

  const card = (children: React.ReactNode) => (
    <div style={{ background:'#fff', borderRadius:16, padding:24, marginBottom:16,
      boxShadow:'0 1px 4px rgba(0,0,0,.08)', border:'1px solid #f1f5f9' }}>
      {children}
    </div>
  )

  const inp:any = { width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0', borderRadius:10,
    fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginTop:4 }
  const lbl:any = { fontSize:12, fontWeight:700, color:'#374151', display:'block' }

  // Barra de progresso
  const ETAPAS = ['identificacao','especialidade','horario','confirmacao']
  const etapaIdx = ETAPAS.indexOf(etapa)

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'system-ui' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0c1424,#0f2040)', padding:'16px 20px',
        display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:10 }}>
        <div style={{ width:36, height:36, background:'#3ECF8E', borderRadius:9,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', fontWeight:700 }}>+</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Policlinica Municipal</div>
          <div style={{ fontSize:11, color:'#64748b' }}>Agendamento Online</div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 16px' }}>

        {/* Progress */}
        {etapa !== 'sucesso' && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              {['Identificacao','Especialidade','Horario','Confirmacao'].map((l,i) => (
                <div key={l} style={{ fontSize:10, fontWeight:i<=etapaIdx?700:400,
                  color:i<=etapaIdx?'#3ECF8E':'#94a3b8', flex:1, textAlign:'center' }}>{l}</div>
              ))}
            </div>
            <div style={{ height:4, background:'#e2e8f0', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'#3ECF8E', borderRadius:2,
                width:`${((etapaIdx+1)/4)*100}%`, transition:'width .3s' }} />
            </div>
          </div>
        )}

        {/* ETAPA 1: IDENTIFICACAO */}
        {etapa === 'identificacao' && (
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Olá! Vamos agendar</h1>
            <p style={{ fontSize:14, color:'#64748b', marginBottom:20 }}>Informe seus dados para continuar</p>
            {card(
              <div>
                <div style={{ marginBottom:12 }}>
                  <label style={lbl}>Nome completo</label>
                  <input style={inp} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome completo" />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={lbl}>CPF</label>
                  <input style={inp} value={cpf} onChange={e=>setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label style={lbl}>Data de nascimento</label>
                  <input type="date" style={inp} value={nasc} onChange={e=>setNasc(e.target.value)} />
                </div>
                {erro && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#dc2626', marginTop:12 }}>{erro}</div>}
                {btn('Continuar →', () => {
                  if (!nome || !cpf || !nasc) { setErro('Preencha todos os campos.'); return }
                  setErro(''); setEtapa('especialidade')
                })}
              </div>
            )}
            <div style={{ background:'#E6F1FB', border:'1px solid #B5D4F4', borderRadius:12, padding:'12px 16px', fontSize:12, color:'#0C447C' }}>
              ℹ️ O agendamento online e gratuito para pacientes do SUS cadastrados na rede municipal.
            </div>
          </div>
        )}

        {/* ETAPA 2: ESPECIALIDADE */}
        {etapa === 'especialidade' && (
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Qual especialidade?</h1>
            <p style={{ fontSize:14, color:'#64748b', marginBottom:20 }}>Escolha o tipo de consulta</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {ESPECIALIDADES.map(e => (
                <div key={e.id} onClick={() => setEsp(e.id)}
                  style={{ background:'#fff', borderRadius:12, padding:'14px 12px',
                    border:`2px solid ${esp===e.id?'#3ECF8E':'#e2e8f0'}`,
                    background: esp===e.id?'#f0fdf4':'#fff',
                    cursor:'pointer', transition:'all .15s', textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{e.emoji}</div>
                  <div style={{ fontSize:12, fontWeight:700, color: esp===e.id?'#166534':'#0f172a' }}>{e.nome}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{e.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setEtapa('identificacao')}
                style={{ flex:1, padding:'13px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', color:'#64748b' }}>
                ← Voltar
              </button>
              <button onClick={()=>{ if(!esp){setErro('Escolha uma especialidade.');return} setErro('');setEtapa('horario') }}
                disabled={!esp}
                style={{ flex:2, padding:'13px', background:esp?'#3ECF8E':'#cbd5e1', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:esp?'pointer':'not-allowed' }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3: HORARIO */}
        {etapa === 'horario' && (
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Escolha o horario</h1>
            <p style={{ fontSize:14, color:'#64748b', marginBottom:16 }}>
              {espObj?.emoji} {espObj?.nome} — {medObj?.nome}
            </p>
            {card(
              <div>
                <label style={lbl}>Data da consulta</label>
                <input type="date" style={inp} min={minDataStr} value={data} onChange={e=>{ setData(e.target.value); setHora('') }} />
              </div>
            )}
            {data && (
              <div style={{ background:'#fff', borderRadius:16, padding:20, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,.08)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Horarios disponíveis</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                  {horarios.map(slot => (
                    <button key={slot.hora} onClick={() => slot.livre && setHora(slot.hora)} disabled={!slot.livre}
                      style={{ padding:'10px 4px', borderRadius:8, border:`1.5px solid ${hora===slot.hora?'#3ECF8E':slot.livre?'#e2e8f0':'#f1f5f9'}`,
                        background: hora===slot.hora?'#3ECF8E':slot.livre?'#fff':'#f8fafc',
                        color: hora===slot.hora?'#fff':slot.livre?'#0f172a':'#cbd5e1',
                        fontSize:13, fontWeight:hora===slot.hora?700:400,
                        cursor:slot.livre?'pointer':'not-allowed', transition:'all .15s' }}>
                      {slot.hora}
                    </button>
                  ))}
                </div>
                {hora && <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#166534', fontWeight:600, marginTop:12 }}>
                  Horario selecionado: {data.split('-').reverse().join('/')} as {hora}
                </div>}
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setEtapa('especialidade')}
                style={{ flex:1, padding:'13px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', color:'#64748b' }}>
                ← Voltar
              </button>
              <button onClick={()=>{ if(!data||!hora){return} setEtapa('confirmacao') }}
                disabled={!data||!hora}
                style={{ flex:2, padding:'13px', background:data&&hora?'#3ECF8E':'#cbd5e1', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:data&&hora?'pointer':'not-allowed' }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 4: CONFIRMACAO */}
        {etapa === 'confirmacao' && (
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Confirmar agendamento</h1>
            <p style={{ fontSize:14, color:'#64748b', marginBottom:20 }}>Verifique os dados antes de confirmar</p>
            <div style={{ background:'#fff', borderRadius:16, padding:24, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,.08)' }}>
              {[
                { l:'Paciente',     v: nome },
                { l:'CPF',          v: cpf },
                { l:'Especialidade',v: `${espObj?.emoji} ${espObj?.nome}` },
                { l:'Medico',       v: medObj?.nome || '—' },
                { l:'Data',         v: data.split('-').reverse().join('/') },
                { l:'Horario',      v: hora },
                { l:'Local',        v: 'Policlinica Municipal' },
                { l:'Tipo',         v: 'Consulta SUS — Gratuita' },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <span style={{ fontSize:13, color:'#64748b' }}>{r.l}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'#FAEEDA', border:'1px solid #FAC775', borderRadius:12, padding:'12px 16px', fontSize:12, color:'#633806', marginBottom:16 }}>
              ⚠️ Compareça 15 minutos antes do horario com documento de identidade e cartao SUS.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setEtapa('horario')}
                style={{ flex:1, padding:'13px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', color:'#64748b' }}>
                ← Voltar
              </button>
              <button onClick={confirmar}
                style={{ flex:2, padding:'13px', background:'#3ECF8E', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Confirmar agendamento
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 5: SUCESSO */}
        {etapa === 'sucesso' && (
          <div style={{ textAlign:'center', paddingTop:20 }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#166534', marginBottom:8 }}>Agendado com sucesso!</h1>
            <p style={{ fontSize:14, color:'#64748b', marginBottom:24 }}>Seu agendamento foi confirmado</p>

            <div style={{ background:'#fff', borderRadius:16, padding:24, marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,.08)', textAlign:'left' }}>
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'14px 16px', marginBottom:16, textAlign:'center' }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Numero de protocolo</div>
                <div style={{ fontSize:24, fontWeight:800, color:'#166534', fontFamily:'monospace', letterSpacing:'.1em' }}>{proto}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Guarde este numero</div>
              </div>
              {[
                { l:'Paciente',     v: nome },
                { l:'Especialidade',v: `${espObj?.emoji} ${espObj?.nome}` },
                { l:'Medico',       v: medObj?.nome || '—' },
                { l:'Data e hora',  v: `${data.split('-').reverse().join('/')} as ${hora}` },
                { l:'Local',        v: 'Policlinica Municipal' },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <span style={{ fontSize:12, color:'#64748b' }}>{r.l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{r.v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:'#E6F1FB', border:'1px solid #B5D4F4', borderRadius:12, padding:'12px 16px', fontSize:12, color:'#0C447C', marginBottom:20, textAlign:'left' }}>
              📱 Voce pode cancelar o agendamento ate 2 horas antes pelo proprio site.
            </div>

            <button onClick={()=>{ setEtapa('identificacao'); setEsp(''); setData(''); setHora(''); setProto('') }}
              style={{ width:'100%', padding:'13px', background:'#3ECF8E', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Fazer outro agendamento
            </button>
          </div>
        )}

      </div>
    </div>
  )
}