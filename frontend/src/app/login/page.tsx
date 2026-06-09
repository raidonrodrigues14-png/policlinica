'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Credenciais dos profissionais
const PROFISSIONAIS = [
  { 
    id: 'recepcionista', 
    label: 'Recepcionista', 
    cor: '#10b981',
    bgLight: '#ecfdf5',
    emoji: '🖥️',
    usuario: 'recepcao',
    senha: '123'
  },
  { 
    id: 'enfermeiro', 
    label: 'Enfermagem', 
    cor: '#10b981',
    bgLight: '#ecfdf5',
    emoji: '🩺',
    usuario: 'enfermeiro',
    senha: '123'
  },
  { 
    id: 'medico', 
    label: 'Médico', 
    cor: '#10b981',
    bgLight: '#ecfdf5',
    emoji: '👨‍⚕️',
    usuario: 'medico',
    senha: '123'
  },
  { 
    id: 'gestor', 
    label: 'Gestor', 
    cor: '#10b981',
    bgLight: '#ecfdf5',
    emoji: '📊',
    usuario: 'gestor',
    senha: '123'
  }
]

// Rotas por perfil
const rotasPorPerfil = {
  recepcionista: '/recepcao',
  enfermeiro: '/triagem',
  medico: '/prontuario',
  gestor: '/gestao'
}

export default function Login() {
  const router = useRouter()
  const [perfilSelecionado, setPerfilSelecionado] = useState('recepcionista')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const profissional = PROFISSIONAIS.find(x => x.id === perfilSelecionado)

  function fazerLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    if (!usuario || !senha) {
      setErro('Preencha usuário e senha')
      setLoading(false)
      return
    }

    // Simular delay de requisição
    setTimeout(() => {
      const credenciaisValidas = PROFISSIONAIS.find(
        p => p.id === perfilSelecionado && p.usuario === usuario && p.senha === senha
      )

      if (credenciaisValidas) {
        localStorage.setItem('usuario', JSON.stringify({
          nome: profissional?.label,
          perfil: perfilSelecionado,
          usuario: usuario
        }))
        
        const rota = rotasPorPerfil[perfilSelecionado as keyof typeof rotasPorPerfil]
        router.replace(rota)
      } else {
        setErro('Usuário ou senha inválidos')
        setLoading(false)
      }
    }, 500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '1rem'
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '1000px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        
        {/* Lado esquerdo - Informações da unidade */}
        <div style={{
          flex: 1,
          backgroundColor: '#064e3b',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#065f46',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <span style={{ fontSize: '24px' }}>🏥</span>
              </div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '0.5rem'
              }}>
                Alto Alegre
              </h1>
              <p style={{ color: '#a7f3d0', fontSize: '14px' }}>
                Especialidades Médicas
              </p>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '1rem' }}>
                Prontuário Eletrônico
              </h2>
              <ul style={{ color: '#d1fae5', fontSize: '14px', lineHeight: '1.8' }}>
                <li style={{ marginBottom: '0.5rem' }}>✓ Atendimento integrado</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Histórico do paciente</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Prescrição digital</li>
                <li>✓ Relatórios gerenciais</li>
              </ul>
            </div>
          </div>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #065f46',
            fontSize: '12px',
            color: '#a7f3d0'
          }}>
            <p>Sistema seguro conforme LGPD</p>
          </div>
        </div>

        {/* Lado direito - Login */}
        <div style={{
          flex: 1,
          padding: '2.5rem',
          backgroundColor: 'white'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              Acessar sistema
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Selecione seu perfil e informe suas credenciais
            </p>
          </div>

          <form onSubmit={fazerLogin}>
            {/* Perfis */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {PROFISSIONAIS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPerfilSelecionado(p.id)
                    setUsuario('')
                    setSenha('')
                    setErro('')
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `1.5px solid ${perfilSelecionado === p.id ? p.cor : '#e5e7eb'}`,
                    backgroundColor: perfilSelecionado === p.id ? p.bgLight : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{p.emoji}</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: perfilSelecionado === p.id ? p.cor : '#374151'
                  }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Usuário */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Usuário
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Digite seu usuário"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = profissional?.cor || '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Senha */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = profissional?.cor || '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Erro */}
            {erro && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.625rem',
                backgroundColor: '#fee2e2',
                borderRadius: '0.5rem',
                fontSize: '13px',
                color: '#dc2626',
                textAlign: 'center'
              }}>
                {erro}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: profissional?.cor || '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Entrando...' : `Entrar como ${profissional?.label}`}
            </button>

            {/* Credenciais de teste */}
            <div style={{
              marginTop: '1.5rem',
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              fontSize: '12px'
            }}>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>🔐 Credenciais de teste:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '11px' }}>
                <span style={{ color: '#10b981' }}>Recepcionista:</span>
                <span style={{ color: '#6b7280' }}>recepcao / 123</span>
                <span style={{ color: '#10b981' }}>Enfermagem:</span>
                <span style={{ color: '#6b7280' }}>enfermeiro / 123</span>
                <span style={{ color: '#10b981' }}>Médico:</span>
                <span style={{ color: '#6b7280' }}>medico / 123</span>
                <span style={{ color: '#10b981' }}>Gestor:</span>
                <span style={{ color: '#6b7280' }}>gestor / 123</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}