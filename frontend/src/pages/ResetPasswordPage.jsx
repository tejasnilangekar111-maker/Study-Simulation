import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    if (!token) return 'Reset link is missing or invalid.'
    if (newPassword.length < 6) return 'Password must be at least 6 characters.'
    if (newPassword !== confirmPassword) return 'Passwords do not match.'
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
      await api.post('/auth/reset-password', { token, newPassword })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setError('This reset link is invalid or has expired.')
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
        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-offwhite/60 text-sm mb-6">Choose a new password for your account.</p>

        {success ? (
          <p className="text-offwhite/80 text-sm mb-4">
            Password updated. Redirecting to sign in…
          </p>
        ) : (
          <>
            <label className="block text-xs mb-1 text-offwhite/70">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/10 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-1 focus:ring-accent-blue"
            />

            <label className="block text-xs mb-1 text-offwhite/70">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/10 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-1 focus:ring-accent-blue"
            />

            {error && <p className="text-coral-500 text-sm mb-3">{error}</p>}

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full bg-accent-blue/90 hover:bg-accent-blue text-walnut-950 font-semibold rounded-lg py-2.5 disabled:opacity-50"
            >
              {loading ? 'Resetting…' : 'Reset password'}
            </motion.button>
          </>
        )}

        <p className="text-center text-sm text-offwhite/60 mt-4">
          <Link to="/login" className="text-accent-blue hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
