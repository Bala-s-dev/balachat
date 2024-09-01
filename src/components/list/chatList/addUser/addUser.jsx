import "./addUser.css";
import { db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore(); // Assumed to get the current logged-in user
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUser(querySnapshot.docs[0].data());
        setError(null);
      } else {
        setUser(null);
        setError("User not found");
      }
    } catch (err) {
      console.error("Error during user search:", err);
      setError("An error occurred while searching for the user.");
    }
  };

  const handleAdd = async () => {
    if (!user || !currentUser) return;

    try {
      // Generate a unique chat ID by sorting and joining the user IDs
      const chatId = [currentUser.id, user.id].sort().join("_");

      // Create or update the chat document in the "chats" collection
      const chatRef = doc(db, "chats", chatId);
      await setDoc(chatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      }, { merge: true });

      // Update the current user's chat list without `serverTimestamp()`
      const currentUserChatsRef = doc(db, "userchats", currentUser.id);
      await updateDoc(currentUserChatsRef, {
        chats: arrayUnion({
          chatId: chatRef.id,
          lastMessage: "",
          receiverId: user.id,
        }),
      });

      // Update the target user's chat list without `serverTimestamp()`
      const targetUserChatsRef = doc(db, "userchats", user.id);
      await updateDoc(targetUserChatsRef, {
        chats: arrayUnion({
          chatId: chatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
        }),
      });

      // Update `updatedAt` field separately
      await updateDoc(currentUserChatsRef, {
        updatedAt: serverTimestamp(),
      });
      await updateDoc(targetUserChatsRef, {
        updatedAt: serverTimestamp(),
      });

      console.log("New chat created with ID:", chatRef.id);

    } catch (err) {
      console.error("Error adding user to chat:", err);
      setError("An error occurred while adding the user to the chat.");
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" required />
        <button type="submit">Search</button>
      </form>
      {error && <div className="error">{error}</div>}
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="User Avatar" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
