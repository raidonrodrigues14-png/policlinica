'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RecepcaoPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const user = localStorage.getItem('usuario')
    
    if (!token) {
      router.push('/auth/login')
    } else {
      setUsuario(JSON.parse(user || '{}'))
    }
  }, [router])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Recepção</h1>
      <p className="text-gray-600 mb-6">Bem-vindo, {usuario?.nome || 'Usuário'}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg">Pacientes</h3>
          <p className="text-3xl text-blue-600 mt-2">0</p>
          <button className="mt-3 text-sm text-blue-500">+ Novo paciente</button>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg">Agendamentos</h3>
          <p className="text-3xl text-green-600 mt-2">0</p>
          <button className="mt-3 text-sm text-blue-500">+ Novo agendamento</button>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg">Fila de Espera</h3>
          <p className="text-3xl text-yellow-600 mt-2">0</p>
          <button className="mt-3 text-sm text-blue-500">Ver fila</button>
        </div>
      </div>
    </div>
  )
}