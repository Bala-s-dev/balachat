import { auth, db } from "../../lib/firebase";
import "./detail.css";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import { arrayRemove, doc, updateDoc } from "firebase/firestore";
import { arrayUnion } from "firebase/firestore/lite";

const Detail = () => {
  const {chatId,
  user,
  isCurrentUserBlocked,
  isReceiverBlocked, changeBlock} = useChatStore();

  const { currentUser } = useUserStore(); // Pulling user info from the store
  const handleBlock =  async() => {

    if(!user) return;
    const userDocRef = doc(db,"users",currentUser.id)

    try {
      await updateDoc(userDocRef,{
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock()

    }catch(err){
      console.log(err)
    }

  }

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
            <div className="photoItem">
              <div className="photoDetail">
                <img
                  src="https://media.istockphoto.com/id/1349374810/photo/a-laptop-half-closed-bright-and-glowing.jpg?s=2048x2048&w=is&k=20&c=ViidfpQUSa3HngqtaU2JX-_p0xEP-WUNkCxqONSh11o="
                  alt="Shared Photo"
                />
                <span>Photo_1.png</span>
              </div>
              <img src="./download.png" className="icon" alt="Download Icon" />
            </div>
            <div className="photoItem">
              <div className="photoDetail">
                <img
                  src="https://media.istockphoto.com/id/1349374810/photo/a-laptop-half-closed-bright-and-glowing.jpg?s=2048x2048&w=is&k=20&c=ViidfpQUSa3HngqtaU2JX-_p0xEP-WUNkCxqONSh11o="
                  alt="Shared Photo"
                />
                <span>Photo_1.png</span>
              </div>
              <img src="./download.png" className="icon" alt="Download Icon" />
            </div>
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="Arrow Up" />
          </div>
        </div>
        <button onClick={handleBlock}>

          isCurrentUserBlocked ? "You are blocked!" : isReceiverBlocked ? "User blocked" : "Block User"



        </button>
        <button className="logout" onClick={() => auth.signOut()}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;