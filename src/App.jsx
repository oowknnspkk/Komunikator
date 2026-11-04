
import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
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

        <div className="logo">MY APP</div>

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

          {error && (
            <div className="error">{error}</div>
          )}

          {message && (
            <div className="success">{message}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>

        </form>

        <p className="login-text">
<<<<<<< HEAD
          Masz już konto?<a href="Login.jsx">Zaloguj się</a>
=======
          Masz już konto? <Link to="/login">Zaloguj się</Link>
>>>>>>> 88ef41f (Zmiany dodanie router i edycja jsx)
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
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
