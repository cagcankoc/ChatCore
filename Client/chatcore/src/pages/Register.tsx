import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/api'

export function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await authService.register(username, password, profilePictureUrl)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kayıt sırasında bir hata oluştu')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Kayıt Ol</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Profil Resmi URL
              </label>
              <input
                type="text"
                value={profilePictureUrl}
                onChange={(e) => setProfilePictureUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:shadow-outline"
              >
                Kayıt Ol
              </button>

              <Link to="/login" className="text-blue-500 hover:text-blue-700">
                Giriş Yap
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 