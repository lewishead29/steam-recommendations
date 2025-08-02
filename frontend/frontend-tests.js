// LandingPage.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockNavigate = jest.fn();

describe('LandingPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders the landing page with all required elements', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Check header and title
    expect(screen.getByText('Steam Game Recommender')).toBeInTheDocument();
    
    // Check form elements
    expect(screen.getByPlaceholderText('Enter your Steam username...')).toBeInTheDocument();
    expect(screen.getByText('Use Achievement Completion Rate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find Games' })).toBeInTheDocument();
    
    // Check footer
    expect(screen.getByText(/© \d{4} Steam Game Recommender/)).toBeInTheDocument();
    expect(screen.getByText('Powered by the Steam API')).toBeInTheDocument();
  });

  test('submits form with username and navigates to loading page', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Enter username
    const usernameInput = screen.getByPlaceholderText('Enter your Steam username...');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Find Games' });
    fireEvent.click(submitButton);
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/loading/testuser?use_achievements=false');
  });

  test('submits form with username and achievement toggle enabled', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Enter username
    const usernameInput = screen.getByPlaceholderText('Enter your Steam username...');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    // Enable achievement toggle
    const achievementToggle = screen.getByRole('checkbox');
    fireEvent.click(achievementToggle);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Find Games' });
    fireEvent.click(submitButton);
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/loading/testuser?use_achievements=true');
  });

  test('navigates to no-steam page when "Click Here" button is clicked', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Click "No Steam" link
    const noSteamButton = screen.getByRole('button', { name: 'Click Here' });
    fireEvent.click(noSteamButton);
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/no-steam');
  });
});

// LoadingPage.test.js
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import LoadingPage from './LoadingPage';

// Mock modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

global.fetch = jest.fn();

describe('LoadingPage Component', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    useParams.mockReturnValue({ username: 'testuser' });
    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([new URLSearchParams('use_achievements=false')]);
    
    // Reset fetch mock
    fetch.mockReset();
    
    // Mock setTimeout
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders loading state correctly', () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve(), 100000))
    );

    render(
      <BrowserRouter>
        <LoadingPage />
      </BrowserRouter>
    );
    
    // Check loading elements
    expect(screen.getByText('Finding your next favorite games...')).toBeInTheDocument();
    expect(screen.getByText('Looking up Steam profile for: testuser')).toBeInTheDocument();
    expect(screen.getByText('This may take a moment while we analyse your game library')).toBeInTheDocument();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  test('navigates to recommendations page on successful API response', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ recommendations: [{ id: 1, name: 'Test Game' }] }),
    };
    
    fetch.mockResolvedValueOnce(mockResponse);

    render(
      <BrowserRouter>
        <LoadingPage />
      </BrowserRouter>
    );
    
    // Wait for API call
    await act(async () => {
      // Wait for promises to resolve
      await Promise.resolve();
    });
    
    // Check if localStorage was set and navigation occurred
    expect(localStorage.getItem('recommendations')).toBeTruthy();
    expect(mockNavigate).toHaveBeenCalledWith('/recommendations/testuser');
  });

  test('shows error on API failure', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    };
    
    fetch.mockResolvedValueOnce(mockResponse);

    render(
      <BrowserRouter>
        <LoadingPage />
      </BrowserRouter>
    );
    
    // Wait for API call
    await act(async () => {
      await Promise.resolve();
    });
    
    // Check localStorage for error
    expect(localStorage.getItem('recommendationsError')).toBeTruthy();
    expect(mockNavigate).toHaveBeenCalledWith('/recommendations/testuser');
  });

  test('shows timeout error after 60 seconds', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve(), 100000))
    );

    render(
      <BrowserRouter>
        <LoadingPage />
      </BrowserRouter>
    );
    
    // Advance timers to trigger timeout
    await act(async () => {
      jest.advanceTimersByTime(61000);
    });
    
    // Check error state
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Request timed out. API server might be down.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });
});

// RecommendationsPage.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecommendationsPage from './RecommendationsPage';

// Mock modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ username: 'testuser' }),
  useNavigate: () => mockNavigate,
}));

const mockNavigate = jest.fn();

describe('RecommendationsPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
    console.log = jest.fn(); // Mock console.log to suppress logs
  });

  test('renders with no recommendations', () => {
    render(
      <BrowserRouter>
        <RecommendationsPage />
      </BrowserRouter>
    );
    
    // Check title and username
    expect(screen.getByText('Recommendations for testuser')).toBeInTheDocument();
    
    // Check no recommendations message
    expect(screen.getByText('No recommendations found.')).toBeInTheDocument();
  });

  test('renders recommendations from localStorage', () => {
    // Setup localStorage with test data
    const testData = {
      recommendations: [
        { 
          appid: 123, 
          name: 'Test Game 1', 
          similarity: 0.95, 
          steam_link: 'https://store.steampowered.com/app/123'
        },
        { 
          appid: 456, 
          name: 'Test Game 2', 
          similarity: 0.85, 
          steam_link: 'https://store.steampowered.com/app/456'
        }
      ]
    };
    
    localStorage.setItem('recommendations', JSON.stringify(testData));

    render(
      <BrowserRouter>
        <RecommendationsPage />
      </BrowserRouter>
    );
    
    // Check if games are rendered
    expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    expect(screen.getByText('Test Game 2')).toBeInTheDocument();
    
    // Check similarity scores
    expect(screen.getByText('Similarity Score: 0.95')).toBeInTheDocument();
    expect(screen.getByText('Similarity Score: 0.85')).toBeInTheDocument();
    
    // Check Steam links
    const links = screen.getAllByText('View on Steam');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://store.steampowered.com/app/123');
    expect(links[1]).toHaveAttribute('href', 'https://store.steampowered.com/app/456');
  });

  test('navigates home when home button is clicked', () => {
    render(
      <BrowserRouter>
        <RecommendationsPage />
      </BrowserRouter>
    );
    
    // Click home button
    const homeButton = screen.getByTitle('Return to Home');
    fireEvent.click(homeButton);
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

// NoSteamPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import NoSteamPage from './NoSteamPage';

// Mock modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('axios');

const mockNavigate = jest.fn();

describe('NoSteamPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    axios.get.mockClear();
    axios.post.mockClear();
  });

  test('renders initial page with search and empty selection', async () => {
    // Mock games response
    axios.get.mockResolvedValueOnce({
      data: {
        games: [
          { id: 1, name: 'Test Game 1' },
          { id: 2, name: 'Test Game 2' }
        ]
      }
    });

    render(
      <BrowserRouter>
        <NoSteamPage />
      </BrowserRouter>
    );
    
    // Wait for games to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/games');
    });
    
    // Check header and title
    expect(screen.getByText('Steam Game Recommender')).toBeInTheDocument();
    expect(screen.getByText('Select up to 5 games you like to get personalised recommendations')).toBeInTheDocument();
    
    // Check search input
    expect(screen.getByPlaceholderText('Search games...')).toBeInTheDocument();
    
    // Check selected games section
    expect(screen.getByText('Selected Games')).toBeInTheDocument();
    expect(screen.getByText('No games selected yet. Search for games above.')).toBeInTheDocument();
    
    // Check button
    expect(screen.getByRole('button', { name: 'Get Recommendations' })).toBeDisabled();
  });

  test('searches for games and displays results', async () => {
    // Mock games response
    axios.get.mockResolvedValueOnce({
      data: {
        games: [
          { id: 1, name: 'Portal 2' },
          { id: 2, name: 'Half-Life 2' },
          { id: 3, name: 'Portal' }
        ]
      }
    });

    render(
      <BrowserRouter>
        <NoSteamPage />
      </BrowserRouter>
    );
    
    // Wait for games to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/games');
    });
    
    // Search for 'Portal'
    const searchInput = screen.getByPlaceholderText('Search games...');
    fireEvent.change(searchInput, { target: { value: 'Portal' } });
    
    // Check search results
    await waitFor(() => {
      expect(screen.getByText('Portal 2')).toBeInTheDocument();
      expect(screen.getByText('Portal')).toBeInTheDocument();
      expect(screen.queryByText('Half-Life 2')).not.toBeInTheDocument();
    });
  });

  test('selects and removes games', async () => {
    // Mock games response
    axios.get.mockResolvedValueOnce({
      data: {
        games: [
          { id: 1, name: 'Portal 2' },
          { id: 2, name: 'Half-Life 2' },
          { id: 3, name: 'Portal' }
        ]
      }
    });

    render(
      <BrowserRouter>
        <NoSteamPage />
      </BrowserRouter>
    );
    
    // Wait for games to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/games');
    });
    
    // Search for 'Portal'
    const searchInput = screen.getByPlaceholderText('Search games...');
    fireEvent.change(searchInput, { target: { value: 'Portal' } });
    
    // Select a game
    await waitFor(() => {
      const portalResult = screen.getByText('Portal');
      fireEvent.click(portalResult);
    });
    
    // Check if game was added to selected games
    expect(screen.queryByText('No games selected yet.')).not.toBeInTheDocument();
    expect(screen.getByText('Portal')).toBeInTheDocument();
    
    // Remove the game
    const removeButton = screen.getByRole('button', { name: 'Remove' });
    fireEvent.click(removeButton);
    
    // Check if game was removed
    expect(screen.getByText('No games selected yet. Search for games above.')).toBeInTheDocument();
  });

  test('gets recommendations when button is clicked', async () => {
    // Mock games response
    axios.get.mockResolvedValueOnce({
      data: {
        games: [
          { id: 1, name: 'Portal 2' },
          { id: 2, name: 'Half-Life 2' }
        ]
      }
    });
    
    // Mock recommendations response
    axios.post.mockResolvedValueOnce({
      data: {
        recommendations: [
          { 
            appid: 3, 
            name: 'Portal', 
            similarity: 0.95, 
            steam_link: 'https://store.steampowered.com/app/3'
          },
          { 
            appid: 4, 
            name: 'Team Fortress 2', 
            similarity: 0.85, 
            steam_link: 'https://store.steampowered.com/app/4'
          }
        ]
      }
    });

    render(
      <BrowserRouter>
        <NoSteamPage />
      </BrowserRouter>
    );
    
    // Wait for games to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/games');
    });
    
    // Add a game to selection
    const searchInput = screen.getByPlaceholderText('Search games...');
    fireEvent.change(searchInput, { target: { value: 'Half-Life' } });
    
    await waitFor(() => {
      const gameResult = screen.getByText('Half-Life 2');
      fireEvent.click(gameResult);
    });
    
    // Click Get Recommendations button
    const getRecsButton = screen.getByRole('button', { name: 'Get Recommendations' });
    expect(getRecsButton).not.toBeDisabled();
    fireEvent.click(getRecsButton);
    
    // Wait for API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/no-steam-recommendations',
        { selectedGames: expect.any(Array) }
      );
    });
    
    // Check recommendations
    expect(screen.getByText('Recommended Games')).toBeInTheDocument();
    expect(screen.getByText('Portal')).toBeInTheDocument();
    expect(screen.getByText('Team Fortress 2')).toBeInTheDocument();
    expect(screen.getByText('Similarity: 0.95')).toBeInTheDocument();
    expect(screen.getByText('Similarity: 0.85')).toBeInTheDocument();
  });

  test('navigates home when home button is clicked', () => {
    // Mock games response
    axios.get.mockResolvedValueOnce({
      data: {
        games: []
      }
    });

    render(
      <BrowserRouter>
        <NoSteamPage />
      </BrowserRouter>
    );
    
    // Click home button
    const homeButton = screen.getByTitle('Return to Home');
    fireEvent.click(homeButton);
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
