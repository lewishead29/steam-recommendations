import psycopg2
import json
import numpy as np
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database credentials from environment variables
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Connect to PostgreSQL (create the database if it doesn't exist)
def create_database():
    """Ensures the database exists before proceeding."""
    conn = psycopg2.connect(database="postgres", user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
    if not cur.fetchone():
        cur.execute(f"CREATE DATABASE {DB_NAME}")
        print(f"Database '{DB_NAME}' created.")
    else:
        print(f"Database '{DB_NAME}' already exists.")
    
    cur.close()
    conn.close()

# Connect to the new database
def connect_db():
    return psycopg2.connect(database=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)

# Create the games table
def create_tables():
    conn = connect_db()
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS games (
            appid INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            genres TEXT[],
            categories TEXT[],
            positive_review_ratio FLOAT,
            active_players INTEGER,
            vector FLOAT[]
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("Table 'games' created (or already exists).")

# Load JSON data
def load_json_data(filepath="final_dataset_sorted.json"):
    with open(filepath, "r", encoding="utf-8") as f: 
        return json.load(f)

# Get unique genres/categories to ensure consistent vector structure
def get_unique_features(games):
    unique_genres = set()
    unique_categories = set()
    
    for game in games:
        unique_genres.update(game["genres"])
        unique_categories.update(game["categories"])
    
    return list(unique_genres), list(unique_categories)

# Precompute and store vectors in the database
def store_game_data():
    games = load_json_data()
    unique_genres, unique_categories = get_unique_features(games)

    conn = connect_db()
    cur = conn.cursor()

    print(f"Found {len(games)} games in JSON. Inserting into database...")

    for game in games:
        appid = game["appid"]
        name = game["name"]
        genres = game["genres"]
        categories = game["categories"]
        positive_review_ratio = game["positive_review_ratio"]
        active_players = game["active_players"]

        # One-hot encode genres & categories
        genre_vector = np.array([1 if g in genres else 0 for g in unique_genres])
        category_vector = np.array([1 if c in categories else 0 for c in unique_categories])

        # Normalise review score and log scale active players
        review_vector = np.array([positive_review_ratio])  
        active_players_vector = np.array([np.log1p(active_players)])  

        # Create final vector
        final_vector = np.concatenate((genre_vector, category_vector, review_vector, active_players_vector))

        try:
            cur.execute("""
                INSERT INTO games (appid, name, genres, categories, positive_review_ratio, active_players, vector)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (appid) DO UPDATE SET 
                    name = EXCLUDED.name,
                    genres = EXCLUDED.genres,
                    categories = EXCLUDED.categories,
                    positive_review_ratio = EXCLUDED.positive_review_ratio,
                    active_players = EXCLUDED.active_players,
                    vector = EXCLUDED.vector
            """, (appid, name, genres, categories, positive_review_ratio, active_players, final_vector.tolist()))
            
            print(f"Inserted {name} (AppID: {appid})")

        except Exception as e:
            print(f"Error inserting {name} (AppID: {appid}): {e}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"Stored {len(games)} games in the database.")

# Run all setup steps
def setup_database():
    create_database()
    create_tables()
    store_game_data()

if __name__ == "__main__":
    setup_database()
    print("Database setup complete.")