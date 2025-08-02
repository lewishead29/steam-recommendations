import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const [username, setUsername] = useState("");
  const [useAchievements, setUseAchievements] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/loading/${username}?use_achievements=${useAchievements}`);
    }
  };

  const handleNoSteamClick = () => {
    navigate("/no-steam");
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Steam Game Recommender</h1>
      </div>
      
      <div className="project-info">
        <div className="info-section">
          <h2>About This Project</h2>
          <p>
            This website was created as part of my Final Year Project submission, aiming to put my recommendation system research into practice. I chose to build a Steam Game recommender as it is a
            platform I am experienced with using and am passionate about.
            The platform analyses your steam library in order to suggest games you might enjoy.
          </p>
          
          <p>Some things to note:</p>
          <ul>
            <li>The platform is not affiliated with Steam</li>
            <li>The platform is not endorsed by Valve</li>
            <li>The Steam profile used must be public in order to use this platform</li>
          </ul>
        </div>
        
        <div className="info-section">
          <h2>How to use!</h2>
          <ol>
            <li>Enter your Steam username or profile URL</li>
            <li>Optionally enable achievement-based weighting for more personalised recommendations</li>
            <li>The system analyses your game library and playtime</li>
            <li>It generates recommendations for games similar to ones you've enjoyed</li>
          </ol>
        </div>
      
      </div>
      
      <form onSubmit={handleSubmit} className="search-bar">
        <input
          type="text"
          placeholder="Enter your Steam username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="achievement-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={useAchievements}
              onChange={(e) => setUseAchievements(e.target.checked)}
            />
            <span className="toggle-text">Use Achievement Completion Rate</span>
          </label>
        </div>
        <button type="submit">Find Games</button>
      </form>
      
      <div className="no-steam-link">
        <p>Don't have a Steam account? <button onClick={handleNoSteamClick} className="text-button">Click Here</button></p>
      </div>
      
      {/* Inline Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>Powered by the Steam API</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;