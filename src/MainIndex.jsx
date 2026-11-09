
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './App.css';

function MainIndex() {
  // Podstawowe dane
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Znajomi
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Dodawanie znajomych
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendError, setFriendError] = useState('');
  const [friendSuccess, setFriendSuccess] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);

  const navigate = useNavigate();

  // Pobieranie profilu użytkownika
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user }, error } =
        await supabase.auth.getUser();

      if (error || !user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Błąd profilu:', profileError);
        return;
      }

      setUsername(profile.username);
    };

    loadProfile();
  }, [navigate]);

  // Pobieranie znajomych
  const loadFriends = async () => {
    const { data: { user }, error: userError } =
      await supabase.auth.getUser();

    if (userError || !user) return;

    const { data: relations, error } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Błąd pobierania znajomych:', error);
      return;
    }

    if (!relations || relations.length === 0) {
      setFriends([]);
      return;
    }

    const friendIds = relations.map(relation =>
      relation.user_id === user.id
        ? relation.friend_id
        : relation.user_id
    );

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', friendIds);

    if (profileError) {
      console.error('Błąd pobierania profili:', profileError);
      return;
    }

    setFriends(profiles || []);
  };

  // Automatyczne pobieranie znajomych
  useEffect(() => {
    loadFriends();
  }, []);

  // Dodawanie znajomego
  const handleAddFriend = async (e) => {
    e.preventDefault();

    const cleanUsername = friendUsername.trim();

    if (!cleanUsername) return;

    setAddingFriend(true);
    setFriendError('');
    setFriendSuccess('');

    try {
      const { data: { user }, error: userError } =
        await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Musisz być zalogowany!');
      }

      // Wyszukiwanie użytkownika
      const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (searchError) throw searchError;

      if (!profile) {
        throw new Error('Nie znaleziono takiego użytkownika.');
      }

      if (profile.id === user.id) {
        throw new Error('Nie możesz dodać samego siebie!');
      }

      // Sprawdzanie, czy znajomy już istnieje
      const { data: existing, error: existingError } = await supabase
        .from('friends')
        .select('id')
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        throw new Error('Ten użytkownik jest już Twoim znajomym.');
      }

      // Zapisywanie znajomego
      const { error: insertError } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: profile.id
        });

      if (insertError) throw insertError;

      setFriendSuccess(`Dodano ${profile.username} do znajomych!`);
      setFriendUsername('');

      await loadFriends();

    } catch (err) {
      setFriendError(err.message);
    } finally {
      setAddingFriend(false);
    }
  };

  // Pobieranie prywatnych wiadomości
  useEffect(() => {
    const loadMessages = async () => {
      setMessages([]);

      if (!selectedFriend) return;

      setLoadingMessages(true);

      try {
        const { data: { user }, error: userError } =
          await supabase.auth.getUser();

        if (userError || !user) return;

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},recipient_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},recipient_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Błąd pobierania wiadomości:', error);
          return;
        }

        setMessages(data || []);

      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedFriend]);

  // Wysyłanie prywatnej wiadomości
  const handleSend = async () => {
    if (!message.trim() || !selectedFriend) return;

    const content = message.trim();

    const { data: { user }, error: userError } =
      await supabase.auth.getUser();

    if (userError || !user) {
      alert('Musisz być zalogowany!');
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: selectedFriend.id,
        content: content
      })
      .select()
      .single();

    if (error) {
      console.error('Błąd wysyłania:', error);
      alert(error.message);
      return;
    }

    setMessages(prev => [...prev, data]);
    setMessage('');
  };

  // Wylogowywanie
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

  return (
    <div className="main-page">

      <button onClick={handleLogout}>
        Wyloguj się
      </button>

      <center>
        <h1>PDF komunikator</h1>
        <h2>Witaj, {username || 'Użytkowniku'}! 👋</h2>
      </center>

      {/* LEWY PANEL */}
      <div className="LeftBox">

        <p>Panel główny</p>

        <h1>Znajomi:</h1>

        <button
          onClick={() => {
            setShowAddFriend(!showAddFriend);
            setFriendError('');
            setFriendSuccess('');
          }}
        >
          + Dodaj znajomego
        </button>

        {/* OKNO DODAWANIA */}
        {showAddFriend && (
          <div className="AddFriendBox">

            <h3>Dodaj znajomego</h3>

            <form onSubmit={handleAddFriend}>

              <input
                type="text"
                placeholder="Nazwa użytkownika..."
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                required
              />

              <button type="submit" disabled={addingFriend}>
                {addingFriend ? 'Dodawanie...' : 'Dodaj'}
              </button>

            </form>

            {friendError && (
              <p className="error">{friendError}</p>
            )}

            {friendSuccess && (
              <p className="success">{friendSuccess}</p>
            )}

          </div>
        )}

        {/* LISTA ZNAJOMYCH */}
        <div className="FriendsList">

          {friends.length === 0 ? (
            <p>Nie masz jeszcze znajomych.</p>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={
                  selectedFriend?.id === friend.id
                    ? 'FriendActive'
                    : 'FriendButton'
                }
              >
                {friend.username}
              </button>
            ))
          )}

        </div>

      </div>

      {/* GŁÓWNY CZAT */}
      <div className="PDFbox">

        {selectedFriend ? (
          <>
            <h2>
              Rozmowa z {selectedFriend.username}
            </h2>

            <div className="MessageBox">

              {loadingMessages ? (
                <p>Ładowanie wiadomości...</p>
              ) : messages.length === 0 ? (
                <p>Nie ma jeszcze wiadomości. Napisz pierwszą!</p>
              ) : (
                messages.map((msg) => (
                  <p key={msg.id}>
                    <strong>
                      {msg.sender_id === selectedFriend.id
                        ? selectedFriend.username
                        : 'Ty'}:
                    </strong>{' '}
                    {msg.content}
                  </p>
                ))
              )}

            </div>

            <input
              type="text"
              id="InputT"
              placeholder="Napisz wiadomość..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
            />

            <button id="Send" onClick={handleSend}>
              Wyślij wiadomość
            </button>
          </>
        ) : (
          <div className="EmptyChat">
            <h2>Witaj w PDF Komunikator!</h2>
            <p>Wybierz znajomego z listy, aby rozpocząć rozmowę.</p>
          </div>
        )}

      </div>

      {/* PRAWY PANEL */}
      <div className="RightBox">

        <p>Kanały</p>

        <h1>Lista dostępnych kanałów:</h1>

        <div className="ServersList">
          <h3>Test</h3>
          <h3>Test</h3>
          <h3>Test</h3>
        </div>

      </div>

    </div>
  );
}

export default MainIndex;
