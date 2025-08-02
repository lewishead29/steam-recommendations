import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function RecommendationsPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const storedData = localStorage.getItem("recommendations");
    console.log("Raw stored data:", storedData);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log("Parsed data:", parsedData);
      const recs = parsedData.recommendations || (Array.isArray(parsedData) ? parsedData : []);
      console.log("Extracted recommendations:", recs);
      setRecommendations(recs);
    } else {
      console.log("No data in localStorage");
    }
  }, []);

  const handleHomeClick = () => {
    navigate("/");
  };

  console.log("Current recommendations state:", recommendations);

  return (
    <div className="recommendations-container">
      <div className="home-button-container">
        <button className="home-button" onClick={handleHomeClick} title="Return to Home">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </button>
      </div>
      <h2 className="recommendations-title">Recommendations for {username}</h2>
      <div className="games-list">
        {recommendations.length > 0 ? (
          recommendations.map((game) => (
            <div key={game.appid} className="game-card">
              <img
                src={`https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/capsule_231x87.jpg`}
                alt={game.name}
                onError={(e) => (e.target.src = "https://via.placeholder.com/231x87?text=Image+Not+Found")}
                className="game-image"
              />
              <div className="game-details">
                <h3 className="game-title">{game.name}</h3>
                <p className="game-score">Similarity Score: {game.similarity.toFixed(2)}</p>
                <a 
                  href={game.steam_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="steam-link"
                >
                  View on Steam
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="no-recommendations">No recommendations found.</p>
        )}
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

export default RecommendationsPage;