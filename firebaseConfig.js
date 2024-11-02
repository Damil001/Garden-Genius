import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqXTKkwk2kIuQJ0X6Fan51jb-wtMUikj4",
  authDomain: "garden-genius-51692.firebaseapp.com",
  databaseURL: "https://garden-genius-51692-default-rtdb.firebaseio.com",
  projectId: "garden-genius-51692",
  storageBucket: "garden-genius-51692.appspot.com",
  messagingSenderId: "50078154733",
  appId: "1:50078154733:web:fc1fdada8e46aaac4ef1e4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
