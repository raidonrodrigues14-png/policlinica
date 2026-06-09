'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => { router.replace('/login') }, [router])
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#0c1424', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:12, background:'#3ECF8E',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:24, color:'#fff', fontWeight:700 }}>＋</div>
      <div style={{ color:'#64748b', fontSize:14 }}>Carregando PoliclínicaMed...</div>
    </div>
  )
}