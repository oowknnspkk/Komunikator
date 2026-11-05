import { useState } from 'react';
import './App.css';
import { useNavigate, Link } from 'react-router-dom'; 
import { supabase } from './supabaseClient';

function MainIndex() {
  
  const navigate = useNavigate(); 

  const handleLogout = async () => {
    const{error} = await supabase.auth.signOut();

    if(error){
      console.error(error.message);
      return;
    }
    navigate('/login')
  };

  return (
   
    <div className="main-page"> 
     <button onClick={handleLogout}>Wyloguj się</button>
      
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
