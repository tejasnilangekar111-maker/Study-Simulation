import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const validate = () => {
    if (!username.trim()) return 'Username is required.'
    if (!email.trim()) return 'Email is required.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/register', { username, email, password })
      const { user, token } = res.data || {}
      setAuth(user || { username, email }, token || 'dev-token')
      navigate('/study')
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-walnut-950 px-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass rounded-2xl p-8 w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-offwhite/60 text-sm mb-6">Start building your study habit today.</p>

        <label className="block text-xs mb-1 text-offwhite/70">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-white/10 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-1 focus:ring-accent-blue"
        />

        <label className="block text-xs mb-1 text-offwhite/70">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/10 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-1 focus:ring-accent-blue"
        />

        <label className="block text-xs mb-1 text-offwhite/70">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/10 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-1 focus:ring-accent-blue"
        />

        {error && <p className="text-coral-500 text-sm mb-3">{error}</p>}

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500/90 hover:bg-emerald-500 text-walnut-950 font-semibold rounded-lg py-2.5 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Register'}
        </motion.button>

        <p className="text-center text-sm text-offwhite/60 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-blue hover:underline">
            Sign in
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
