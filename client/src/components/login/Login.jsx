import { useState } from "react";
import { toast } from "react-toastify";
import "./login.css";
import upload from "../../lib/upload";
import { api } from "../../lib/api"; // Import our api helper
import { useUserStore } from "../../lib/userStore"; // Import login action

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  const [loading, setLoading] = useState(false);
  const { loginUser } = useUserStore(); // Get the action from the store

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      let imgUrl = "./avatar.png";
      if (avatar.file) {
        // 1. Upload avatar first
        imgUrl = await upload(avatar.file);
      }

      // 2. Register user
      await api.post("/auth/register", {
        username,
        email,
        password,
        avatar: imgUrl,
      });

      toast.success("Account Created! You can login now!");
    } catch (err) {
      console.error("Error during registration:", err);
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      // Sign in the user with email and password
      const res = await api.post("/auth/login", { email, password });

      // Save user and token to store, which also saves to localStorage
      loginUser(res.data);
      
      toast.success("Successfully logged in!");
    } catch (err) {
      console.error("Error during login:", err);
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="avatar" />
            Upload an image
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleAvatar}
          />
          <input type="text" placeholder="Username" name="username" required />
          <input type="email" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button type="submit" disabled={loading}>
            {loading ? "Loading" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;