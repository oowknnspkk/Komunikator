import { useState } from 'react'
import './App.css'

function MainIndex() {
  const [name, setName] = useState('Chaos')

  return (
    <div className="main-page">
      <h1>Witaj w PDF komunikator (lepszej nazwy nie wymyśliłem XD)</h1>
     <div className="PDFbox">
     <input type="text" class="InputT" placeholder="Wpisz cos..."></input>
     </div>
    </div>
  )
}

export default MainIndex
