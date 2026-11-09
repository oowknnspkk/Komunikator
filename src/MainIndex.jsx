
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function MainIndex() {
    const navigate = useNavigate();

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

    // POBIERANIE UŻYTKOWNIKA
    useEffect(() => {
        const loadUser = async () => {
            const { data, error } = await supabase.auth.getUser();

            if (error || !data.user) {
                navigate("/login");
                return;
            }

            setUser(data.user);

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", data.user.id)
                .single();

            if (!profileError && profile) {
                setUsername(profile.username);
            }
        };

        loadUser();
    }, [navigate]);

    // POBIERANIE ZNAJOMYCH
    const loadFriends = async () => {
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData.user;

        if (!currentUser) return;

        const { data: relations, error } = await supabase
            .from("friends")
            .select("*")
            .or(
                `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
            );

        if (error) {
            console.error("Błąd pobierania znajomych:", error);
            return;
        }

        const friendIds = relations.map((relation) =>
            relation.user_id === currentUser.id
                ? relation.friend_id
                : relation.user_id
        );

        if (friendIds.length === 0) {
            setFriends([]);
            return;
        }

        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", friendIds);

        if (profilesError) {
            console.error("Błąd pobierania profili:", profilesError);
            return;
        }

        setFriends(profiles || []);
    };

    useEffect(() => {
        if (user) {
            loadFriends();
        }
    }, [user]);

    // DODAWANIE ZNAJOMEGO
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
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, username")
                .ilike("username", cleanUsername)
                .maybeSingle();

            if (profileError) {
                throw profileError;
            }

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
                .or(
                    `and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`
                )
                .maybeSingle();

            if (existingError) {
                throw existingError;
            }

            if (existing) {
                setFriendError("Ten użytkownik jest już Twoim znajomym.");
                return;
            }

            const { error: insertError } = await supabase
                .from("friends")
                .insert({
                    user_id: user.id,
                    friend_id: profile.id
                });

            if (insertError) {
                throw insertError;
            }

            setFriendSuccess(`Dodano użytkownika ${profile.username}!`);
            setFriendUsername("");

            await loadFriends();

        } catch (error) {
            console.error("Błąd dodawania znajomego:", error);
            setFriendError("Nie udało się dodać znajomego.");
        } finally {
            setAddingFriend(false);
        }
    };

    // WIADOMOŚCI + SUPABASE REALTIME
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

            // Najpierw pobieramy wcześniejsze wiadomości
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(
                    `and(sender_id.eq.${user.id},recipient_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},recipient_id.eq.${user.id})`
                )
                .order("created_at", { ascending: true });

            if (!active) return;

            if (error) {
                console.error("Błąd pobierania wiadomości:", error);
            } else {
                setMessages(data || []);
            }

            setLoadingMessages(false);

            // Nasłuchiwanie nowych wiadomości
            channel = supabase
                .channel(`chat-${user.id}-${selectedFriend.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages"
                    },
                    (payload) => {
                        const newMessage = payload.new;

                        const isOurConversation =
                            (newMessage.sender_id === user.id &&
                                newMessage.recipient_id === selectedFriend.id) ||
                            (newMessage.sender_id === selectedFriend.id &&
                                newMessage.recipient_id === user.id);

                        if (isOurConversation) {
                            setMessages((previous) => {
                                if (
                                    previous.some(
                                        (msg) => msg.id === newMessage.id
                                    )
                                ) {
                                    return previous;
                                }

                                return [...previous, newMessage].sort(
                                    (a, b) =>
                                        new Date(a.created_at) -
                                        new Date(b.created_at)
                                );
                            });
                        }
                    }
                )
                .subscribe((status) => {
                    console.log("Status Realtime:", status);
                });
        };

        loadMessages();

        // Wyłączamy nasłuchiwanie po zmianie rozmowy
        return () => {
            active = false;

            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [selectedFriend, user]);

    // WYSYŁANIE WIADOMOŚCI
    const handleSend = async (e) => {
        e.preventDefault();

        const cleanMessage = message.trim();

        if (!cleanMessage || !selectedFriend || !user) return;

        const { data, error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                recipient_id: selectedFriend.id,
                content: cleanMessage
            })
            .select()
            .single();

        if (error) {
            console.error("Błąd wysyłania wiadomości:", error);
            return;
        }

        // Dodajemy wiadomość lokalnie.
        // Realtime nie doda jej drugi raz dzięki sprawdzeniu ID.
        setMessages((previous) => {
            if (previous.some((msg) => msg.id === data.id)) {
                return previous;
            }

            return [...previous, data];
        });

        setMessage("");
    };

    // WYLOGOWANIE
    const handleLogout = async () => {
        await supabase.auth.signOut({ scope: "local" });
        navigate("/login");
    };

    return (
        <div className="main-page">

            <h1>PDF Komunikator</h1>

            {/* LEWY PANEL */}
            <div className="LeftBox">

                <p>Witaj, {username || "Użytkowniku"}!</p>

                <button
                    type="button"
                    onClick={() => {
                        setShowAddFriend(!showAddFriend);
                        setFriendError("");
                        setFriendSuccess("");
                    }}
                >
                    {showAddFriend ? "Anuluj" : "+ Dodaj znajomego"}
                </button>

                {showAddFriend && (
                    <div className="AddFriendBox">

                        <form onSubmit={handleAddFriend}>

                            <input
                                type="text"
                                placeholder="Nazwa użytkownika"
                                value={friendUsername}
                                onChange={(e) =>
                                    setFriendUsername(e.target.value)
                                }
                            />

                            <button type="submit" disabled={addingFriend}>
                                {addingFriend ? "Dodawanie..." : "Dodaj"}
                            </button>

                        </form>

                        {friendError && (
                            <p>{friendError}</p>
                        )}

                        {friendSuccess && (
                            <p>{friendSuccess}</p>
                        )}

                    </div>
                )}

                <h3>Znajomi</h3>

                <div className="FriendsList">

                    {friends.length === 0 && (
                        <p>Nie masz jeszcze znajomych.</p>
                    )}

                    {friends.map((friend) => (
                        <button
                            type="button"
                            key={friend.id}
                            className={
                                selectedFriend?.id === friend.id
                                    ? "FriendActive"
                                    : "FriendButton"
                            }
                            onClick={() => setSelectedFriend(friend)}
                        >
                            {friend.username}
                        </button>
                    ))}

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

                            {loadingMessages && (
                                <p>Ładowanie wiadomości...</p>
                            )}

                            {!loadingMessages && messages.length === 0 && (
                                <div className="EmptyChat">
                                    <p>Nie ma jeszcze wiadomości.</p>
                                    <p>Rozpocznij rozmowę!</p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id}>
                                    <strong>
                                        {msg.sender_id === user?.id
                                            ? "Ty"
                                            : selectedFriend.username}
                                    </strong>

                                    <p>{msg.content}</p>

                                    <small>
                                        {new Date(
                                            msg.created_at
                                        ).toLocaleString("pl-PL")}
                                    </small>
                                </div>
                            ))}

                        </div>

                        <form onSubmit={handleSend}>

                            <input
                                id="InputT"
                                type="text"
                                placeholder="Napisz wiadomość..."
                                value={message}
                                onChange={(e) =>
                                    setMessage(e.target.value)
                                }
                            />

                            <button id="Send" type="submit">
                                Wyślij
                            </button>

                        </form>
                    </>
                ) : (
                    <div className="EmptyChat">
                        <h2>Witaj w komunikatorze!</h2>
                        <p>Wybierz znajomego, aby rozpocząć rozmowę.</p>
                    </div>
                )}

            </div>

            {/* PRAWY PANEL */}
            <div className="RightBox">
                <h3>Panel dodatkowy</h3>
                <p>Test</p>
            </div>

            {/* WYLOGOWANIE */}
            <button type="button" onClick={handleLogout}>
                Wyloguj się
            </button>

        </div>
    );
}

export default MainIndex;
