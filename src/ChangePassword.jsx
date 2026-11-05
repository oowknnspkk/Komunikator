import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import './RL.css'

function ChangePassword() {
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChangePassword = async (e) => {
    e.preventDefault()

    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków.')
      return
    }

    if (password !== repeatPassword) {
      setError('Hasła nie są identyczne.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage('Hasło zostało pomyślnie zmienione!')
      setPassword('')
      setRepeatPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="register-card">
        <div className="logo">PDF Komunikator</div>

        <h1>Zmień hasło</h1>

        <p className="subtitle">
          Ustaw nowe hasło do swojego konta
        </p>

        <form onSubmit={handleChangePassword}>
          <label>Nowe hasło</label>

          <input
            type="password"
            placeholder="Wpisz nowe hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <label>Powtórz nowe hasło</label>

          <input
            type="password"
            placeholder="Powtórz nowe hasło"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Zapisz nowe hasło'}
          </button>
        </form>

        <p className="login-text">
          <a href="/main">Powrót do aplikacji</a>
        </p>
      </div>
    </div>
  )
}

export default ChangePassword
