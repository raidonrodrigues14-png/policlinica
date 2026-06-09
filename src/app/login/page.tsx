'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PERFIS = [
  { id: 'recepcionista', label: 'Recepcionista', cor: '#22c55e', emoji: '🖥️' },
  { id: 'enfermeiro',    label: 'Enfermagem',    cor: '#3b82f6', emoji: '🩺' },
  { id: 'medico',        label: 'Médico',        cor: '#ec4899', emoji: '👨‍⚕️' },
  { id: 'gestor',        label: 'Gestor',        cor: '#f59e0b', emoji: '📊' },
]

export default function LoginPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState('recepcionista')

  function loginDemo(p: string) {
    const nomes: Record<string,string> = {
      recepcionista: 'Ana Paula Costa',
      enfermeiro: 'Enf. Camila Torres',
      medico: 'Dr. Roberto Nunes',
      gestor: 'Sec. Municipal de Saúde',
    }
    localStorage.setItem('usuario', JSON.stringify({ nome: nomes[p], perfil: p }))
    localStorage.setItem('accessToken', 'demo-token')
    router.replace('/recepcao')
  }

  const cor = PERFIS.find(p => p.id === perfil)?.cor || '#3ECF8E'

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'system-ui' }}>
      <div style={{ flex:1, background:'linear-gradient(135deg,#0c1424,#0f2040)',
        display:'flex', flexDirection:'column', justifyContent:'center', padding:64 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#3ECF8E',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, color:'#fff', fontWeight:700 }}>＋</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>PoliclínicaMed</div>
            <div style={{ fontSize:12, color:'#475569' }}>Sistema Municipal de Saúde</div>
          </div>
        </div>
        <h1 style={{ fontSize:38, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:16 }}>
          Cuidado com<br/><span style={{ color:'#3ECF8E' }}>precisão digital</span>
        </h1>
        <p style={{ fontSize:14, color:'#7a9cc4', lineHeight:1.7, maxWidth:360 }}>
          Prontuário eletrônico integrado para toda a equipe de saúde.
        </p>
      </div>

      <div style={{ width:420, background:'#f8fafc', display:'flex',
        alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ width:'100%', maxWidth:340 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:6 }}>Entrar no sistema</h2>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:24 }}>Escolha seu perfil</p>

          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
            {PERFIS.map(p => (
              <div key={p.id} onClick={() => setPerfil(p.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                  borderRadius:10, border:`2px solid ${perfil===p.id ? p.cor : '#e2e8f0'}`,
                  background: perfil===p.id ? `${p.cor}15` : '#fff',
                  cursor:'pointer', transition:'all .15s' }}>
                <span style={{ fontSize:22 }}>{p.emoji}</span>
                <span style={{ fontSize:13, fontWeight:700,
                  color: perfil===p.id ? p.cor : '#0f172a' }}>{p.label}</span>
              </div>
            ))}
          </div>

          <button onClick={() => loginDemo(perfil)}
            style={{ width:'100%', padding:13, background: cor, color:'#fff',
              border:'none', borderRadius:10, fontSize:15, fontWeight:700,
              cursor:'pointer', transition:'background .2s' }}>
            Entrar como {PERFIS.find(p=>p.id===perfil)?.label} →
          </button>

          <p style={{ fontSize:11, color:'#94a3b8', textAlign:'center', marginTop:14 }}>
            Modo demonstração — sem necessidade de servidor
          </p>
        </div>
      </div>
    </div>
  )
}