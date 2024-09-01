import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,

  // Function to fetch user info
  fetchUserInfo: async (uid) => {
    if (!uid) {
      return set({ currentUser: null, isLoading: false });
    }

    try {
      // Reference to the user document in Firestore
      const docRef = doc(db, "users", uid);
      // Fetch the document snapshot
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // If the document exists, set the user data and stop loading
        set({ currentUser: docSnap.data(), isLoading: false });
      } else {
        // If the document does not exist, clear the user data and stop loading
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.log("Error fetching user info:", err);
      // On error, clear the user data and stop loading
      set({ currentUser: null, isLoading: false });
    }
  },

  // Optional: Reset the user state (can be useful)
  resetUser: () => set({ currentUser: null, isLoading: true }),
}));
