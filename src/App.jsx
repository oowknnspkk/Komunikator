
import { useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate
} from 'react-router-dom'

import { supabase } from './supabaseClient'
import MainIndex from './MainIndex'
import Login from './Login'
import './App.css'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        setMessage(
          'Konto zostało utworzone! Sprawdź swoją skrzynkę e-mail, aby potwierdzić rejestrację.'
        )
        setEmail('')
        setPassword('')
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
        <div className="logo">PDF Komunikator</div>

        <h1>Utwórz konto</h1>

        <p className="subtitle">
          Zarejestruj się, aby rozpocząć
        </p>

        <form onSubmit={handleRegister}>
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
            placeholder="Minimum 6 znaków"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="login-text">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/main" element={<MainIndex />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
