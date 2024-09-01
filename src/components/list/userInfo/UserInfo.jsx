import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";

const UserInfo = () => {
  // Destructure currentUser inside the component
  const { currentUser } = useUserStore();

  return (
    <div className='userInfo'>
      <div className="user">
        <img src={currentUser?.avatar || "./avatar.png"} alt="User Avatar" />
        <h2>{currentUser?.username || "Guest"} </h2>
      </div>
      <div className="icons">
        <img src="./more.png" alt="More Options" />
        <img src="./video.png" alt="Start Video Call" />
        <img src="./edit.png" alt="Edit Profile" />
      </div>
    </div>
  );
}

export default UserInfo;
