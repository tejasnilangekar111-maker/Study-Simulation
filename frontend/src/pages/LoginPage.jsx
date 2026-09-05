import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const validate = () => {
    if (!email.trim()) return 'Email is required.'
    if (!password) return 'Password is required.'
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
      const res = await api.post('/auth/login', { usernameOrEmail: email, password })
      const { username, token } = res.data || {}
      setAuth(username ? { username, email } : { email }, token || 'dev-token')
      navigate('/study')
    } catch {
      setError('Login failed. Check your credentials and try again.')
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
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-offwhite/60 text-sm mb-6">Sign in to continue your study session.</p>

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
          className="w-full bg-white/10 rounded-lg px-3 py-2 mb-1 outline-none focus:ring-1 focus:ring-accent-blue"
        />

        <p className="text-right text-xs mb-4">
          <Link to="/forgot-password" className="text-accent-blue hover:underline">
            Forgot password?
          </Link>
        </p>

        {error && <p className="text-coral-500 text-sm mb-3">{error}</p>}

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="w-full bg-accent-blue/90 hover:bg-accent-blue text-walnut-950 font-semibold rounded-lg py-2.5 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </motion.button>

        <p className="text-center text-sm text-offwhite/60 mt-4">
          No account?{' '}
          <Link to="/register" className="text-accent-blue hover:underline">
            Register
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
