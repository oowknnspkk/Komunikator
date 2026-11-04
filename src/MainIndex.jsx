import { useState } from 'react'
import './App.css'

function MainIndex() {
  const [name, setName] = useState('Chaos')

  return (
    <div className="main-page">
     <h1>PDF - Komunikator :3</h1>
     <p>Witaj drogi uzytkowniku w komunikatorze internetowym na nazwie "PDF"</p>
    </div>
  )
}

export default MainIndex
