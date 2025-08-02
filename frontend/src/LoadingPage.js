import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

function LoadingPage() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const useAchievements = searchParams.get('use_achievements') === 'true';
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const requestMade = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setError("Request timed out. API server might be down.");
    }, 60000);
    setTimeoutId(id);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (requestMade.current) return;
    requestMade.current = true;
    
    const apiUrl = `http://localhost:5000/recommendations?username=${encodeURIComponent(username)}&use_achievements=${useAchievements}`;
    console.log("Fetching recommendations from:", apiUrl);
    
    fetch(apiUrl)
      .then((res) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          setTimeoutId(null);
        }
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("User not found or has no games");
          } else {
            throw new Error(`Server responded with status: ${res.status}`);
          }
        }
        return res.json();
      })
      .then((data) => {
        console.log("Fetched data:", data);
        if (!data.recommendations || data.recommendations.length === 0) {
          throw new Error("No recommendations found for this user");
        }
        localStorage.setItem("recommendations", JSON.stringify(data));
        navigate(`/recommendations/${username}`);
      })
      .catch((err) => {
        console.error("Error fetching recommendations:", err);
        localStorage.setItem("recommendationsError", err.message);
        navigate(`/recommendations/${username}`);
      });
  }, [username, navigate, timeoutId, useAchievements]);

  if (error) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <h2 className="error-title">Error</h2>
          <p className="error">{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="try-again-button"
          >
            Try Again
          </button>
        </div>
        {/* Inline Footer */}
        <footer className="footer">
          <div className="footer-content">
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className="loading-content">
        <h2 className="loading-title">Finding your next favourite games...</h2>
        <div className="spinner"></div>
        <p className="loading-text">This may take a moment while we analyse your game library</p>
        <p className="username-text">Looking up Steam profile for: {username}</p>
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

export default LoadingPage;