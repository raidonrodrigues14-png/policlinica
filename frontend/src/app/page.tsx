'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function Home() {
  const router = useRouter()
  useEffect(() => { router.replace('/login') }, [router])
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0c1424'}}><p style={{color:'#3ECF8E',fontSize:18,fontFamily:'system-ui'}}>Carregando PoliclínicaMed...</p></div>
}
