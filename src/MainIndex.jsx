import { useState } from 'react'
import './App.css'

function MainIndex() {
  const [name, setName] = useState('Chaos')

  return (
     <div class="main-page">
       <button>Wyloguj sie</button>
          <center><h1>PDF komunikator</h1></center>
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
