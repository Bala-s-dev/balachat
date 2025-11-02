import axios from "axios"; // <-- ADD THIS LINE
import { api, API_URL } from "./api"; // Use our new api helper

const upload = async (file) => {
    if (!file) throw new Error("No file provided for upload");

    const formData = new FormData();
    formData.append("file", file); // 'file' must match backend multer key

    try {
        // We use /upload, not /api/upload, because it's a special route
        // for public uploads (registration)
        // For authenticated uploads, we'd use 'api.post("/upload",...)'

        // Let's create a separate 'publicApi' for this
        const publicApi = axios.create({ baseURL: API_URL });
        const res = await publicApi.post("/api/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data.url; // Returns http://localhost:5000/uploads/file-123.jpg
    } catch (err) {
        console.error("Upload error:", err);
        throw new Error(err.response?.data?.message || "Upload failed");
    }
};

export default upload;