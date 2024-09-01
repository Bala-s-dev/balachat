import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

const upload = async (file) => {
  if (!file) throw new Error("No file provided for upload");

  const date = new Date().toISOString();
  
  // Create a reference to the file in Firebase Storage
  const storageRef = ref(storage, `images/${date}_${file.name}`);

  // Optional: Define metadata (if you have specific metadata to add)
  const metadata = {
    contentType: file.type, // Ensure that the content type is set correctly
  };

  // Start the file upload with metadata
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    // Listen for state changes, errors, and completion of the upload
    uploadTask.on('state_changed',
      (snapshot) => {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        // Handle errors
        switch (error.code) {
          case 'storage/unauthorized':
            reject("User doesn't have permission to access the object.");
            break;
          case 'storage/canceled':
            reject("User canceled the upload.");
            break;
          case 'storage/unknown':
            reject("Unknown error occurred: " + error.message);
            break;
          default:
            reject("Upload failed: " + error.message);
        }
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        }).catch((error) => {
          reject("Failed to get download URL: " + error.message);
        });
      }
    );
  });
};

export default upload;
