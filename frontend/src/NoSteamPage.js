import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

const NoSteamPage = () => {
  const [games, setGames] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load games from the backend
    const fetchGames = async () => {
      try {
        const response = await axios.get("http://localhost:5000/games");
        setGames(response.data.games);
      } catch (err) {
        setError("Failed to load games. Please try again later.");
      }
    };
    fetchGames();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === "") {
      setSearchResults([]);
      return;
    }
    
    const filtered = games.filter(game =>
      game.name.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
  };

  const handleGameSelect = (game) => {
    if (selectedGames.length >= 5) {
      setError("You can only select up to 5 games");
      return;
    }
    if (!selectedGames.find(g => g.id === game.id)) {
      setSelectedGames([...selectedGames, { ...game, rank: selectedGames.length + 1 }]);
      setError(null);
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  const handleGameRemove = (gameId) => {
    const updatedGames = selectedGames
      .filter(game => game.id !== gameId)
      .map((game, index) => ({ ...game, rank: index + 1 }));
    setSelectedGames(updatedGames);
  };

  const handleGetRecommendations = async () => {
    if (selectedGames.length === 0) {
      setError("Please select at least one game");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:5000/no-steam-recommendations", {
        selectedGames: selectedGames
      });
      setRecommendations(response.data.recommendations);
    } catch (err) {
      setError("Failed to get recommendations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  return (
    <div className="no-steam-container">
      <div className="home-button-container">
        <button className="home-button" onClick={handleHomeClick} title="Return to Home">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </button>
      </div>
      
      <h1>Steam Game Recommender</h1>
      <p>Select up to 5 games you like to get personalised recommendations!</p>

      <div className="game-selection">
        <div className="game-search">
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={handleSearch}
          />
          
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(game => (
                <div
                  key={game.id}
                  className={`search-result-item ${selectedGames.find(g => g.id === game.id) ? 'selected' : ''} ${selectedGames.length >= 5 && !selectedGames.find(g => g.id === game.id) ? 'disabled' : ''}`}
                  onClick={() => handleGameSelect(game)}
                >
                  <div className="name">{game.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="selected-games">
          <h2>Selected Games</h2>
          {selectedGames.length === 0 ? (
            <p className="no-games-message">No games selected yet. Search for games above.</p>
          ) : (
            selectedGames.map((game, index) => (
              <div key={game.id} className="game-item">
                <div className="rank">{index + 1}</div>
                <div className="name">{game.name}</div>
                <button onClick={() => handleGameRemove(game.id)}>Remove</button>
              </div>
            ))
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        className="get-recommendations-btn"
        onClick={handleGetRecommendations}
        disabled={selectedGames.length === 0 || loading}
      >
        {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
      </button>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <h2>Recommended Games</h2>
          {recommendations.map((game, index) => (
            <div key={game.appid} className="game-item recommendation">
              <div className="rank">{index + 1}</div>
              <img 
                src={`https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/capsule_231x87.jpg`}
                alt={game.name}
                className="game-banner"
                onError={(e) => (e.target.src = "https://via.placeholder.com/231x87?text=Image+Not+Found")}
              />
              <div className="game-info">
                <div className="name">{game.name}</div>
                <div className="score">Similarity: {game.similarity.toFixed(2)}</div>
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
          ))}
        </div>
      )}
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>Powered by the Steam API</p>
        </div>
      </footer>
    </div>
  );
};

export default NoSteamPage; 