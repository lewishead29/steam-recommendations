import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import LoadingPage from './LoadingPage';
import RecommendationsPage from './RecommendationsPage';
import NoSteamPage from './NoSteamPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/loading/:username" element={<LoadingPage />} />
          <Route path="/recommendations/:username" element={<RecommendationsPage />} />
          <Route path="/no-steam" element={<NoSteamPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;