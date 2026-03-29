import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import Header from "./components/Header/Header";
import TripDetailPage from "./pages/TripDetailPage/TripDetailPage";
import Contact from "./pages/ContactPage/Contact";
import AddNewTrip from "./pages/AddTripPage/AddNewTrip";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/trip/:id" element={<TripDetailPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/newTrip" element={<AddNewTrip />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
