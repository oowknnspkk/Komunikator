import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>Witaj w React!</h1>
        <p>Licznik: {count}</p>
        <button onClick={() => setCount(count + 1)}>
          Dodaj
        </button>
      </div>
    </>
  )
}

export default App
