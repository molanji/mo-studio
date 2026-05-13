'use client'
import { useRouter } from 'next/navigation'

export default function LogoutBtn() {
  const router = useRouter()

  function logout() {
    document.cookie = 'mo-studio-auth=; max-age=0; path=/'
    router.push('/login')
  }

  return (
    <button onClick={logout} style={{
      background: 'transparent', border: '1px solid #2A2A2A',
      borderRadius: 8, color: '#555', padding: '6px 14px',
      fontSize: '0.8rem', fontWeight: 500,
      transition: 'color 0.15s, border-color 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.color='#F0F0F0'; e.currentTarget.style.borderColor='#444' }}
    onMouseLeave={e => { e.currentTarget.style.color='#555'; e.currentTarget.style.borderColor='#2A2A2A' }}>
      Log out
    </button>
  )
}
