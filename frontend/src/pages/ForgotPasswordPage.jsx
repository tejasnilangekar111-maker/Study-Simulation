import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
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
        <h1 className="text-2xl font-bold mb-1">Forgot password?</h1>
        <p className="text-offwhite/60 text-sm mb-6">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {submitted ? (
          <p className="text-offwhite/80 text-sm mb-4">
            If an account exists for that email, a reset link has been sent.
          </p>
        ) : (
          <>
            <label className="block text-xs mb-1 text-offwhite/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Sending…' : 'Send reset link'}
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
