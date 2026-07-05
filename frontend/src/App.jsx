import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Scanner from './pages/Scanner';

function App() {
  return (
    <Router>
      <Routes>
        {/* When the user goes to the main URL, show the Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* When the user clicks the Launch button, route them to the Scanner */}
        <Route path="/app" element={<Scanner />} />
      </Routes>
    </Router>
  );
}

export default App;