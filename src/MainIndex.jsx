import { useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom';

function MainIndex() {
  const [name, setName] = useState('Chaos')
  const handleLogin = () => {
    navigate('/Login');
  }
  return (
     <div class="main-page">
       <Link to="/register">Wyloguj sie</Link>
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
