# 🎯 Device Recommender

An AI-powered device recommendation system with a chat interface that helps users find the perfect tech device based on their preferences, budget, and needs.

## 🏗️ Architecture

```
┌─────────────────┐     POST /recommend     ┌─────────────────┐     Gemini API     ┌─────────────────┐
│                 │ ──────────────────────► │                 │ ─────────────────► │                 │
│  React Frontend │                         │  Flask Backend  │                    │  Google Gemini  │
│  (Chat + Form)  │ ◄────────────────────── │   (API Server)  │ ◄───────────────── │   2.5 Flash     │
│                 │     JSON Response       │                 │   Recommendation   │                 │
└─────────────────┘                         └─────────────────┘                    └─────────────────┘
                                                    │
                                                    │ Image Search
                                                    ▼
                                            ┌─────────────────┐
                                            │ Google Custom   │
                                            │ Search API      │
                                            └─────────────────┘
```

## 📁 Project Structure

```
Project101_thesis/
├── backend/
│   ├── app.py              # Flask API server with Gemini + Image Search
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductCardMini.jsx  # Compact product card for chat
│   │   │   ├── ProductCardMini.css
│   │   │   ├── QuizForm.jsx         # Legacy quiz form (unused)
│   │   │   ├── QuizForm.css
│   │   │   ├── ProductCard.jsx      # Legacy full card (unused)
│   │   │   └── ProductCard.css
│   │   ├── App.jsx         # Main chat interface
│   │   ├── App.css
│   │   └── main.jsx        # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## ✨ Features

### 💬 Chat Interface
- **Natural language input** - Type requests like "I need a smartphone under $500 for photography"
- **Bubble chat UI** - Modern chat experience similar to ChatGPT/Gemini
- **Helper form** - Click ⚙️ button to use dropdown selections if you don't know how to ask

### 🔍 Smart Parsing
The AI automatically understands:
- Device type (smartphone, laptop, tablet, PC)
- Budget from mentioned prices
- Purpose (gaming, photography, work, etc.)
- Brand preferences
- Location for nearby shops

### 📱 Compact Product Cards
- Product name and brand
- Real product images (via Google Custom Search API)
- Price estimate
- Why it matches your needs
- Expandable details (specs, pros/cons, nearby shops, alternatives)

### 🛒 Detailed Recommendations
- Full specifications
- Pros and Cons analysis
- Nearby shops in your city
- Alternative product suggestions

## 🚀 Getting Started

### Prerequisites

- Python 3.12 (not 3.14 - compatibility issues)
- Node.js 18+
- Google Gemini API Key
- Google Custom Search API Key (optional, for images)

### Backend Setup

```bash
cd backend

# Create virtual environment with Python 3.12
py -3.12 -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\activate

# Activate (Git Bash)
source venv/Scripts/activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install flask flask-cors google-genai requests

# Run server
python app.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the App

- Frontend: http://localhost:5173 (Vite default)
- Backend API: http://localhost:5000

## 🔑 API Keys Configuration

### Required: Gemini API Key
Get from: https://aistudio.google.com/app/apikey

In `backend/app.py`:
```python
client = genai.Client(api_key="YOUR_GEMINI_API_KEY")
```

### Optional: Google Custom Search API (for product images)

1. Create a search engine at https://programmablesearchengine.google.com/
   - Enable "Image search"
   - Select "Search the entire web"
   - Copy the Search Engine ID

2. Get API key from https://console.cloud.google.com/apis/credentials
   - Enable "Custom Search API"

3. In `backend/app.py`:
```python
GOOGLE_SEARCH_API_KEY = "YOUR_API_KEY"
GOOGLE_SEARCH_CX = "YOUR_SEARCH_ENGINE_ID"
```

**Free tier:** 100 queries/day

## 🔧 API Endpoints

### POST /recommend

Request body:
```json
{
  "device": "Smartphone",
  "budget": "$600–$1000",
  "purpose": "Photography",
  "brand": "Apple",
  "city": "Bangkok",
  "rawQuery": "I need a smartphone for photography under $1000"
}
```

Response:
```json
{
  "productName": "iPhone 15 Pro",
  "brand": "Apple",
  "price": "$999",
  "imageUrl": "https://...",
  "specs": {
    "display": "6.1\" Super Retina XDR",
    "processor": "A17 Pro",
    "ram": "8GB",
    "storage": "256GB",
    "battery": "Up to 23 hours video",
    "weight": "187g"
  },
  "reasoning": "Perfect for photography with its advanced camera system...",
  "prosAndCons": {
    "pros": ["Excellent camera", "Premium build"],
    "cons": ["High price"]
  },
  "nearbyShops": [
    {"name": "Apple Store", "address": "...", "phone": "..."}
  ],
  "alternatives": [
    {"name": "Samsung Galaxy S24", "price": "$899", "reason": "..."}
  ]
}
```

### GET /health

Health check endpoint.

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, CSS3
- **Backend:** Flask, Flask-CORS, Requests
- **AI:** Google Gemini 2.5 Flash with Google Search grounding
- **Images:** Google Custom Search API
- **Styling:** Custom CSS with gradients, animations, chat bubbles

## 📝 Notes

### Why Python 3.14 doesn't work
The `google-genai` package depends on `protobuf`, which has compatibility issues with Python 3.14's new metaclass restrictions. Use Python 3.12 instead.

### Why Gemini can't provide image URLs directly
The Gemini API can search the web for information but cannot browse and verify image URLs. It generates URLs based on patterns, but these often don't work due to:
- Dynamic/session-based URLs from retailers
- Hotlinking protection
- Frequently changing image paths

Solution: Use Google Custom Search API to fetch real, working image URLs.

## 📝 License

MIT License
