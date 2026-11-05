import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './App.css';

function MainIndex() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error.message);
      return;
    }

    navigate('/login');
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
    </div>
  );
}

export default MainIndex;
