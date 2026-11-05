import { useState } from 'react'
import './App.css'

function MainIndex() {
  const [name, setName] = useState('Chaos')

  return (
     <div class="main-page">
        <div class="PDFbox">
            <div class="MessageBox">
                
            </div>
            <input type="text" id="InputT" placeholder="Wpisz cos..."></input>
            <button id="Send">Wyślij wiadomość</button>
        </div>
    </div>
  )
}

export default MainIndex
