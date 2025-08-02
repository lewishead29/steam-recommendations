from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import psycopg2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Flask app setup
app = Flask(__name__)
CORS(app)

# PostgreSQL Database Credentials from environment variables
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Steam API Key from environment variables
API_KEY = os.getenv("STEAM_API_KEY")

# Connect to PostgreSQL
def connect_db():
    return psycopg2.connect(database=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)

# Fetch all precomputed game vectors from database
def get_game_vectors():
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT appid, vector FROM games")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Convert DB data to dictionary {appid: np.array(vector)}
    return {appid: np.array(vector, dtype=np.float32) for appid, vector in rows}

# Cache for achievement data to prevent repeated API calls
achievement_cache = {}

# Fetch achievement data for a game
def get_game_achievements(appid, steam_id):
    """
    Fetches achievement data for a specific game and user.
    
    Returns:
        Tuple of (total_achievements, completed_achievements)
    """
    # Check cache first
    cache_key = f"{appid}_{steam_id}"
    if cache_key in achievement_cache:
        print(f"Using cached achievement data for game {appid}")
        return achievement_cache[cache_key]
    
    try:
        # Get global achievement stats for the game
        global_stats = requests.get(
            f"https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?key={API_KEY}&gameid={appid}"
        ).json()
        
        if not global_stats.get("achievementpercentages", {}).get("achievements"):
            result = (0, 0)
            achievement_cache[cache_key] = result
            return result
            
        total_achievements = len(global_stats["achievementpercentages"]["achievements"])
        
        # Get user's achievement stats for the game
        user_stats = requests.get(
            f"https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key={API_KEY}&steamid={steam_id}&appid={appid}&l=en"
        ).json()
        
        if not user_stats.get("playerstats", {}).get("achievements"):
            result = (total_achievements, 0)
            achievement_cache[cache_key] = result
            return result
            
        completed_achievements = sum(1 for achievement in user_stats["playerstats"]["achievements"] 
                                   if achievement.get("achieved") == 1)
        
        result = (total_achievements, completed_achievements)
        achievement_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"Error fetching achievements for game {appid}: {str(e)}")
        result = (0, 0)
        achievement_cache[cache_key] = result
        return result

# Fetch user data from Steam API
@app.route('/player-data', methods=['GET'])
def get_player_data():
    """
    Fetches player Steam data, including owned games and playtime.
    
    Request Params:
        username: Steam username

    Returns:
        JSON object with player Steam ID and owned games.
    """
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400

    try:
        # Attempt to resolve the username to a SteamID
        steam_id = username
        vanity_response = requests.get(
            f"https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key={API_KEY}&vanityurl={username}"
        )
        vanity_data = vanity_response.json().get("response", {})
        if vanity_data.get("success") == 1:
            steam_id = vanity_data.get("steamid")

        # Fetch owned games
        games_response = requests.get(
            f"https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key={API_KEY}&steamid={steam_id}&format=json&include_appinfo=true"
        )
        games_data = games_response.json().get("response", {}).get("games", [])

        if not games_data:
            return jsonify({"error": "No games found for this user."}), 404

        # Create a dictionary of {appid: playtime}
        user_games = {int(game["appid"]): game["playtime_forever"] for game in games_data}
        

        return jsonify({"steam_id": steam_id, "games": user_games})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Build the user profile vector
def build_user_profile(user_games, steam_id, use_achievements=False):
    """
    Creates a user profile vector based on their owned games and playtime.
    
    user_games: Dict of {appid: playtime in minutes}
    steam_id: User's Steam ID
    use_achievements: Whether to use achievement completion rates for weighting
    
    Returns:
        NumPy array representing user preferences.
    """
    game_vectors = get_game_vectors()
    num_features = len(next(iter(game_vectors.values())))  # Ensure correct vector length
    user_vector = np.zeros(num_features, dtype=np.float32)

    total_playtime = sum(user_games.values())  # Sum of all playtime
    if total_playtime == 0:
        print("User has no playtime data. Returning zero vector.")
        return user_vector  

    matched_games = [appid for appid in user_games.keys() if appid in game_vectors]

    if len(matched_games) == 0:
        print("No games in user's profile match the database. Returning zero vector.")
        return user_vector

    # Pre-fetch achievement data for all games if achievements are enabled
    achievement_data = {}
    if use_achievements:
        print("Fetching achievement data for all games...")
        for appid in matched_games:
            achievement_data[appid] = get_game_achievements(appid, steam_id)
        print(f"Fetched achievement data for {len(achievement_data)} games")

    for appid in matched_games:
        playtime = user_games[appid]
        weight = playtime / total_playtime  # Base weight from playtime
        
        # If achievements are enabled, adjust the weight based on completion rate
        if use_achievements and appid in achievement_data:
            total_achievements, completed_achievements = achievement_data[appid]
            if total_achievements > 0:
                completion_rate = completed_achievements / total_achievements
                # Combine playtime and completion rate weights
                weight = (weight + completion_rate) / 2
                print(f"Game {appid}: Completion rate {completion_rate:.2f}, Final weight {weight:.2f}")
        
        user_vector += game_vectors[appid] * weight  # Weighted sum of vectors

    user_vector = normalize(user_vector.reshape(1, -1))[0]
    print(f"Final user vector (first 10 values): {user_vector[:10]}")
    return user_vector

# Generate game recommendations
@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    """
    Generates game recommendations for a given Steam user.

    Request Params:
        username: Steam username
        use_achievements: Whether to use achievement completion rates (optional)
    
    Returns:
        JSON list of recommended games with similarity scores.
    """
    username = request.args.get('username')
    use_achievements = request.args.get('use_achievements', 'false').lower() == 'true'
    
    if not username:
        return jsonify({"error": "Username is required"}), 400

    # Fetch user data from Steam API
    player_data = get_player_data().json
    if "error" in player_data:
        return jsonify(player_data), 400  # Return error if user not found

    user_games = {int(appid): playtime for appid, playtime in player_data["games"].items()}
    print("User games keys:", list(user_games.keys())[:10])  # First 10 appids

    # Step 1: Create user profile vector
    user_vector = build_user_profile(user_games, player_data["steam_id"], use_achievements)

    # Step 2: Get all stored game vectors
    game_vectors = get_game_vectors()

    # Step 3: Compute similarity
    similarities = []
    owned_games = set(user_games.keys())
    for appid, game_vector in game_vectors.items():
        if appid not in owned_games:
            sim_score = float(cosine_similarity([user_vector], [game_vector])[0][0])  # Convert float32 to float
            similarities.append((appid, sim_score))

    # Step 4: Sort by similarity and return top 10 recommendations
    similarities.sort(key=lambda x: x[1], reverse=True)
    top_recommendations = similarities[:10]

    # Fetch game details
    conn = connect_db()
    cur = conn.cursor()
    recommendations = []
    for appid, score in top_recommendations:
        cur.execute("SELECT name FROM games WHERE appid = %s", (appid,))
        game_name = cur.fetchone()[0]
        recommendations.append({
            "appid": appid,
            "name": game_name,
            "similarity": round(float(score), 4),  # Convert float32 to float
            "steam_link": f"https://store.steampowered.com/app/{appid}"
        })
    cur.close()
    conn.close()

    return jsonify({"recommendations": recommendations})

@app.route('/no-steam-recommendations', methods=['POST'])
def no_steam_recommendations():
    try:
        data = request.get_json()
        selected_games = data.get('selectedGames', [])
        
        if not selected_games:
            return jsonify({'error': 'No games selected'}), 400
            
        # Get all stored game vectors
        game_vectors = get_game_vectors()
        
        # Create user vector based on selected games
        # Get the dimension of the vectors from the first game
        if not game_vectors:
            return jsonify({'error': 'No game vectors found in database'}), 500
            
        first_game_id = next(iter(game_vectors))
        vector_dim = len(game_vectors[first_game_id])
        user_vector = np.zeros(vector_dim)
        
        # Weight games based on their rank (higher rank = higher weight)
        max_rank = len(selected_games)
        for game in selected_games:
            rank = game.get('rank', max_rank)
            weight = (max_rank - rank + 1) / max_rank  # Normalise weight between 0 and 1
            game_id = game.get('id')
            
            if game_id in game_vectors:
                user_vector += game_vectors[game_id] * weight
        
        # Normalise the user vector
        if np.any(user_vector):
            user_vector = user_vector / np.linalg.norm(user_vector)
        
        # Compute similarity with all games
        similarities = []
        for appid, game_vector in game_vectors.items():
            # Skip games that were already selected
            if any(game.get('id') == appid for game in selected_games):
                continue
                
            sim_score = float(cosine_similarity([user_vector], [game_vector])[0][0])
            similarities.append((appid, sim_score))
        
        # Sort by similarity and get top 10 recommendations
        similarities.sort(key=lambda x: x[1], reverse=True)
        top_recommendations = similarities[:10]
        
        # Fetch game details
        conn = connect_db()
        cur = conn.cursor()
        recommendations = []
        for appid, score in top_recommendations:
            cur.execute("SELECT name FROM games WHERE appid = %s", (appid,))
            game_name = cur.fetchone()[0]
            recommendations.append({
                "appid": appid,
                "name": game_name,
                "similarity": round(float(score), 4),
                "steam_link": f"https://store.steampowered.com/app/{appid}"
            })
        cur.close()
        conn.close()
        
        return jsonify({
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/games', methods=['GET'])
def get_games():
    """
    Fetches all games from the database.
    
    Returns:
        JSON object with a list of games.
    """
    try:
        conn = connect_db()
        cur = conn.cursor()
        cur.execute("SELECT appid, name FROM games ORDER BY name")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        games = [{"id": appid, "name": name} for appid, name in rows]
        return jsonify({"games": games})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)