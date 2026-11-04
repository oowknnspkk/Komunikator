
import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        setMessage('Zalogowano pomyślnie!')

        // Tutaj później przekierujemy użytkownika
        // do głównego ekranu komunikatora.
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="register-card">

        <div className="logo">MY APP</div>

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

          {error && (
            <div className="error">{error}</div>
          )}

          {message && (
            <div className="success">{message}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>

        </form>

        <p className="login-text">
          Nie masz jeszcze konta?{' '}
          <a href="/register">Zarejestruj się</a>
        </p>

      </div>
    </div>
  )
}

export default Login
