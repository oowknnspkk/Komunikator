import { useState } from 'react';
import './App.css';
import { useNavigate, Link } from 'react-router-dom'; 

function MainIndex() {
  const [name, setName] = useState('Chaos');
  const navigate = useNavigate(); 

  const handleLogin = () => {
    navigate('/Login');
  };

  return (
   
    <div className="main-page"> 
      <Link to="/register">Wyloguj sie</Link>
      
      <center><h1>PDF komunikator</h1></center>
      
      <div className="PDFbox">
        <div className="MessageBox">
         
        </div>
        
        <input type="text" id="InputT" placeholder="Wpisz cos..." />
        <button id="Send">Wyślij wiadomość</button>
      </div>
    </div>
  );
}

export default MainIndex;
