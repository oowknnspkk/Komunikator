import { useState } from 'react'
import './App.css'

function MainIndex() {
  const [name, setName] = useState('Chaos')

  return (
    <div className="main-page">
     <h1 id="Info">PDF - Komunikator :3</h1>
     <p id="p1">Witaj drogi uzytkowniku w komunikatorze internetowym na nazwie "PDF"</p>
    </div>
  )
}

export default MainIndex
