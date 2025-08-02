# Final Year Project - Implementation of a Machine Learning Recommendation System

**Author:** Lewis Head  
**Registration Number:** 100375072  
**Supervisor:** Dr Jeannette Chin  

## Project Overview

This project implements a web-based machine learning recommendation system for Steam games. The system uses content-based filtering with cosine similarity to provide personalised game recommendations based on user preferences, playtime data, and optional achievement completion rates.

### Key Features
- **Steam API Integration**: Fetches real-time user data and game information
- **Content-Based Filtering**: Uses cosine similarity for recommendation generation
- **Achievement-Based Weighting**: Optional enhancement for more personalised recommendations
- **No-Steam Support**: Allows users without Steam accounts to receive recommendations
- **Responsive Web Interface**: Built with React.js for cross-platform compatibility

## Project Structure

```
steam-recs/
├── backend/
│   ├── app.py                         # Main Flask application
│   ├── setup_db.py                    # Database setup and vector computation
│   ├── requirements.txt               # Python dependencies
│   ├── final_dataset_sorted.json      # Dataset .json file
│   └── .env.example                   # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.js                     # Main React application
│   │   ├── App.css                    # Styling
│   │   ├── LandingPage.js             # Homepage component
│   │   ├── LoadingPage.js             # Loading screen component
│   │   ├── RecommendationsPage.js     # Results display component
│   │   ├── NoSteamPage.js             # Alternative user flow
│   │   ├── index.js                   # React entry point
│   │   └── index.css                  # Base styling
│   ├── public/
│   ├── package.json                   # Node.js dependencies
│   └── frontend-tests.js              # Jest test suite
├── documentation/
│   └── 100375072_3YP_Report.pdf       # Project report, backup to Blackboard submission
├── testing/
│   ├── backend-api-tests.json         # POSTman test script for testing the API endpoints
│   └── steam-api-tests.json           # Postman test script for testing required Steam API endpoints
└── README.md                          # File explaining the submission
```

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- PostgreSQL 12 or higher
- Steam API Key

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend/
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   ```
   Edit `.env` and add your credentials:
   ```
   DB_NAME=steam_recs
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   STEAM_API_KEY=your_steam_api_key
   ```

4. **Create and populate the database:**
   Ensure PostgreSQL is running and accessible with the credentials in your `.env` file
   ```bash
   python setup_db.py
   ```

5. **Start the Flask server:**
   ```bash
   python app.py
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend/
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000`

### Database Setup


## Usage

### For Steam Users
1. Navigate to the homepage
2. Enter your Steam username
3. Optionally enable achievement-based weighting
4. Wait for recommendations to generate
5. Browse personalised game suggestions

### For Non-Steam Users
1. Click "Click Here" on the homepage to access the No-Steam flow
2. Search and select up to 5 games you enjoy
3. Rank them by preference
4. Click "Get Recommendations" to receive suggestions


## Technical Details

### Architecture
- **Frontend**: React.js with React Router for navigation
- **Backend**: Flask with RESTful API design
- **Database**: PostgreSQL
- **Recommendation System**: Content-Based Filtering using cosine similarity
- **External API**: Steam Web API for real-time data

### Key Algorithms
- **Feature Vector Creation**: One-hot encoding for genres/categories, normalised review scores, log-transformed player counts
- **User Profile Generation**: Weighted average of game vectors based on playtime and optional achievement completion
- **Similarity Calculation**: Cosine similarity between user profile and game vectors

## Dataset

The project uses a custom-created dataset of 3,735 Steam games, filtered by:
- Minimum 70% positive review ratio
- Minimum 25 active players during peak hours
- Complete metadata availability

Dataset creation scripts and methodology are detailed in the project report.


## Disclaimers

- This project is for academic purposes only
- Not affiliated with or endorsed by Valve Corporation or Steam
- Steam API usage complies with Valve's terms of service
- Game data is publicly available through Steam's API

---

**University of East Anglia**  
**Faculty of Science, School of Computing Sciences**  

**2025**
