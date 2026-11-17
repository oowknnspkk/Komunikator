
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function MainIndex() {
    const navigate = useNavigate();
    const messageBoxRef = useRef(null);

    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendUsername, setFriendUsername] = useState("");
    const [friendError, setFriendError] = useState("");
    const [friendSuccess, setFriendSuccess] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [addingFriend, setAddingFriend] = useState(false);
    const [channels, setChannels] = useState([]);

    useLayoutEffect(() => {
        const box = messageBoxRef.current;
        if (box && !loadingMessages) box.scrollTop = box.scrollHeight;
    }, [messages, loadingMessages, selectedFriend]);

    useEffect(() => {
        const loadUser = async () => {
            const { data, error } = await supabase.auth.getUser();

            if (error || !data.user) {
                navigate("/login");
                return;
            }

            setUser(data.user);

            const { data: profile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", data.user.id)
                .single();

            if (profile) setUsername(profile.username);
        };

        loadUser();
    }, [navigate]);

    const loadFriends = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: relations, error } = await supabase
            .from("friends")
            .select("*")
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (error) {
            console.error(error);
            return;
        }

        const ids = relations.map(r =>
            r.user_id === user.id ? r.friend_id : r.user_id
        );

        if (!ids.length) {
            setFriends([]);
            return;
        }

        const { data, error: profileError } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", ids);

        if (profileError) {
            console.error(profileError);
            return;
        }

        setFriends(data || []);
    };

    useEffect(() => {
        if (user) loadFriends();
    }, [user]);

    const handleAddFriend = async (e) => {
        e.preventDefault();
        setFriendError("");
        setFriendSuccess("");

        const cleanUsername = friendUsername.trim();

        if (!cleanUsername) {
            setFriendError("Wpisz nazwę użytkownika.");
            return;
        }

        if (!user) return;

        setAddingFriend(true);

        try {
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id, username")
                .ilike("username", cleanUsername)
                .maybeSingle();

            if (error) throw error;
            if (!profile) {
                setFriendError("Nie znaleziono takiego użytkownika.");
                return;
            }

            if (profile.id === user.id) {
                setFriendError("Nie możesz dodać samego siebie.");
                return;
            }

            const { data: existing, error: existingError } = await supabase
                .from("friends")
                .select("id")
                .or(`and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`)
                .maybeSingle();

            if (existingError) throw existingError;

            if (existing) {
                setFriendError("Ten użytkownik jest już Twoim znajomym.");
                return;
            }

            const { error: insertError } = await supabase
                .from("friends")
                .insert({ user_id: user.id, friend_id: profile.id });

            if (insertError) throw insertError;

            setFriendSuccess(`Dodano użytkownika ${profile.username}!`);
            setFriendUsername("");
            await loadFriends();
        } catch (error) {
            console.error(error);
            setFriendError("Nie udało się dodać znajomego.");
        } finally {
            setAddingFriend(false);
        }
    };

    useEffect(() => {
        if (!selectedFriend || !user) {
            setMessages([]);
            return;
        }

        let channel;
        let active = true;

        const loadMessages = async () => {
            setLoadingMessages(true);
            setMessages([]);

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},recipient_id.eq.${user.id})`)
                .order("created_at", { ascending: true });

            if (!active) return;

            if (error) console.error(error);
            else setMessages(data || []);

            setLoadingMessages(false);

            channel = supabase
                .channel(`chat-${user.id}-${selectedFriend.id}`)
                .on("postgres_changes", {
                    event: "INSERT",
                    schema: "public",
                    table: "messages"
                }, ({ new: msg }) => {
                    const valid =
                        (msg.sender_id === user.id && msg.recipient_id === selectedFriend.id) ||
                        (msg.sender_id === selectedFriend.id && msg.recipient_id === user.id);

                    if (valid) {
                        setMessages(prev =>
                            prev.some(m => m.id === msg.id)
                                ? prev
                                : [...prev, msg].sort((a, b) =>
                                    new Date(a.created_at) - new Date(b.created_at)
                                )
                        );
                    }
                })
                .subscribe();
        };

        loadMessages();

        return () => {
            active = false;
            if (channel) supabase.removeChannel(channel);
        };
    }, [selectedFriend, user]);

    const handleSend = async (e) => {
        e.preventDefault();

        const content = message.trim();
        if (!content || !selectedFriend || !user) return;

        const { data, error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                recipient_id: selectedFriend.id,
                content
            })
            .select()
            .single();

        if (error) {
            console.error(error);
            return;
        }

        setMessages(prev =>
            prev.some(m => m.id === data.id)
                ? prev
                : [...prev, data].sort((a, b) =>
                    new Date(a.created_at) - new Date(b.created_at)
                )
        );

        setMessage("");
    };

    const handleLogout = async () => {
        await supabase.auth.signOut({ scope: "local" });
        navigate("/login");
    };
    
    // funcjonalność tworzenia kanałów
    const addChannel = async () => {
        const name = prompt("podaj nazwe kanału");
        if(!name.trim()) return;

        const {error} = await supabase
            .form("channels")
            .insert({name: name.trim()});

        if (error) {
            alert ("Błąd, nie mozna stworzyc kanału")
            return;
        }
        loadChannels();
    }

const loadChannels = async () => {
    const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Błąd pobierania kanałów:", error);
        return;
    }

    setChannels(data || []);
};
    
    return (
        <div className="main-page">
            <h1>PDF Komunikator</h1>

            <div className="LeftBox">
                <p>Witaj, {username || "Użytkowniku"}!</p>

                <button type="button" onClick={() => {
                    setShowAddFriend(!showAddFriend);
                    setFriendError("");
                    setFriendSuccess("");
                }}>
                    {showAddFriend ? "Anuluj" : "+ Dodaj znajomego"}
                </button>

                {showAddFriend && (
                    <div className="AddFriendBox">
                        <form onSubmit={handleAddFriend}>
                            <input
                                value={friendUsername}
                                onChange={e => setFriendUsername(e.target.value)}
                                placeholder="Nazwa użytkownika"
                            />
                            <button type="submit" disabled={addingFriend}>
                                {addingFriend ? "Dodawanie..." : "Dodaj"}
                            </button>
                        </form>
                        {friendError && <p>{friendError}</p>}
                        {friendSuccess && <p>{friendSuccess}</p>}
                    </div>
                )}

                <h3>Znajomi</h3>

                <div className="FriendsList">
                    {friends.length === 0 && <p>Nie masz jeszcze znajomych.</p>}

                    {friends.map(friend => (
                        <button
                            key={friend.id}
                            type="button"
                            className={selectedFriend?.id === friend.id ? "FriendActive" : "FriendButton"}
                            onClick={() => setSelectedFriend(friend)}
                        >
                            {friend.username}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="PDFbox">
                <div className="BoxStyles">
                {selectedFriend ? (
                    <>
                        <h2>Rozmowa z {selectedFriend.username}</h2>

                        <div className="MessageBox" ref={messageBoxRef}>
                            {loadingMessages && <p>Ładowanie wiadomości...</p>}

                            {!loadingMessages && messages.length === 0 && (
                                <div className="EmptyChat">
                                    <p>Nie ma jeszcze wiadomości.</p>
                                    <p>Rozpocznij rozmowę!</p>
                                </div>
                            )}

                            {messages.map(msg => (
                                <div key={msg.id}>
                                    <strong>{msg.sender_id === user?.id ? "Ty" : selectedFriend.username}</strong>
                                    <p>{msg.content}</p>
                                    <small>{new Date(msg.created_at).toLocaleString("pl-PL")}</small>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSend}>
                            <input
                                id="InputT"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Napisz wiadomość..."
                            />
                            <button id="Send" type="submit">Wyślij</button>
                        </form>
                    </>
                ) : (
                    <div className="EmptyChat">
                        <h2>Witaj w komunikatorze!</h2>
                        <p>Wybierz znajomego lub kanał, aby rozpocząć rozmowę.</p>
                    </div>
                )}
                    </div>
            </div>
    
            <div className="RightBox">
    <h3>Kanały:</h3>

    <button type="button" onClick={addChannel}>
        + Utwórz kanał
    </button>

    <div className="ChannelsList">
        {channels.length === 0 ? (
            <p>Nie masz żadnych kanałów.</p>
        ) : (
            channels.map(channel => (
                <button
                    key={channel.id}
                    type="button"
                    className="ChannelButton"
                    onClick={() => console.log("Wybrano kanał:", channel.name)}
                >
                    # {channel.name}
                </button>
            ))
        )}
    </div>
</div>

            <button type="button" onClick={handleLogout}>Wyloguj się</button>
        </div>
    );
}

export default MainIndex;
