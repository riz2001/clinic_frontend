// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


// import BookAppointment from './pages/BookAppointment';
// import MyAppointments from './pages/MyAppointments';
import Login from './components/pages/Login';
import Doctorlist from './components/pages/Doctorlist';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/doctors" element={<Doctorlist />} />
     
        {/* <Route path="/appointments" element={<MyAppointments />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
