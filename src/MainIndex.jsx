import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './App.css';

function MainIndex() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const navigate = useNavigate();

  const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut({
      scope: 'local'
    });

    if (error) {
      console.error('Błąd wylogowania:', error.message);
      alert(error.message);
      return;
    }

    navigate('/login', { replace: true });

  } catch (err) {
    console.error('Błąd:', err);
  }
};

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages([...messages, message.trim()]);
    setMessage('');
  };

  return (
    <div className="main-page">

      <button onClick={handleLogout}>
        Wyloguj się
      </button>

      <center>
        <h1>PDF komunikator</h1>
      </center>

      <div className="PDFbox">

        <div className="MessageBox">
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>

        <input
          type="text"
          id="InputT"
          placeholder="Wpisz coś..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />

        <button id="Send" onClick={handleSend}>
          Wyślij wiadomość
        </button>

      </div>
      <div class="LeftBox">
          <p>Panel głowny</p>
          <h1>Znajomi:</h1>
        <div class="FriendsList">
        <h3>Nigger</h3> 
       <h3>Cwel</h3> 
          <h3>Kamil Łobaza</h3> 
      </div>
      </div>
      <div class="RightBox">
          <p>Panel głowny</p>
          <h1>Znajomi:</h1>
        <div class="ServersList">
        <h3>Test</h3> 
        <h3>Test</h3> 
        <h3>Test</h3> 
      </div>
      </div>
      
    </div>
  );
}

export default MainIndex;
