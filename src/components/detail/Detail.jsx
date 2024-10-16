import { auth, db } from "../../lib/firebase";
import "./detail.css";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import { arrayRemove, doc, updateDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { arrayUnion } from "firebase/firestore/lite";
import { useEffect, useState } from "react";

const Detail = () => {
  const { chatId, user, changeBlock, isReceiverBlocked } = useChatStore();
  const { currentUser } = useUserStore(); // Pulling user info from the store

  const [sharedPhotos, setSharedPhotos] = useState([]);

  const handleBlock = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSharedPhotos = async () => {
    if (!chatId) return;

    const photosRef = collection(db, "chats", chatId, "sharedPhotos"); // Adjust collection path as necessary
    const q = query(photosRef, orderBy("timestamp", "desc"), limit(5));
    
    const querySnapshot = await getDocs(q);
    const photos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setSharedPhotos(photos);
  };

  useEffect(() => {
    fetchSharedPhotos();
  }, [chatId]); // Fetch shared photos when chatId changes

  return (
    <div className="detail">
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="User Avatar" />
        <h2>{user?.username}</h2>
        <p>{currentUser ? currentUser.bio : "Welcome to the chat application."}</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="./arrowUp.png" alt="Arrow Up" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & Help</span>
            <img src="./arrowUp.png" alt="Arrow Up" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Photos</span>
            <img src="./arrowDown.png" alt="Arrow Down" />
          </div>
          <div className="photos">
            {sharedPhotos.length > 0 ? (
              sharedPhotos.map(photo => (
                <div key={photo.id} className="photoItem">
                  <div className="photoDetail">
                    <img src={photo.url} alt={`Shared Photo ${photo.id}`} />
                    <span>{new Date(photo.timestamp.toDate()).toLocaleString()}</span>
                  </div>
                  <img src="./download.png" className="icon" alt="Download Icon" />
                </div>
              ))
            ) : (
              <p>No shared photos available.</p>
            )}
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="Arrow Up" />
          </div>
        </div>
        <button onClick={handleBlock}>Block User</button>
        <button className="logout" onClick={() => auth.signOut()}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;
