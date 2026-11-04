import { useState } from 'react'
import './App.css'

function MainIndex() {
  const [name, setName] = useState('Chaos')

  return (
    <div className="main-page">
     <div className="PDFbox">
     <input type="text" class="InputT" placeholder="Wpisz cos..."></input>
     </div>
    </div>
  )
}

export default MainIndex
