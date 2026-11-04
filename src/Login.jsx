
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './App.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        navigate('/main')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="LoginPage">
      <div className="register-card">
        <div className="logo">PDF</div>

        <h1>Witaj ponownie!</h1>

        <p className="subtitle">
          Zaloguj się na swoje konto
        </p>

        <form onSubmit={handleLogin}>
          <label>Adres e-mail</label>

          <input
            type="email"
            placeholder="twoj@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Hasło</label>

          <input
            type="password"
            placeholder="Wpisz swoje hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <p className="login-text">
          Nie masz jeszcze konta?{' '}
          <Link to="/register">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
