# AI Agent Instructions

# Project Overview
This project is an AI-powered recommendation chatbot web application.

The chatbot helps users find:
- Smartphones
- Laptops
- Notebooks
- Tech gadgets

The frontend quiz (helper form) should collect user requirements based on:
- Budget
- Brand preference
- Specifications
- User needs
- Performance category
- Use case (gaming, study, office, creator, etc.)

---

# Tech Stack

## Frontend
- React
- Tailwind CSS (Optional / Custom CSS as established)
- Axios
- React Router

## Backend
- Python (Flask API) / Node.js
- SQLite / MongoDB
- JWT Authentication

## AI Features
- AI chatbot conversation flow
- Recommendation engine
- Product filtering system
- User preference analysis

---

# General Coding Rules

- Write clean and maintainable code
- Use modular architecture
- Prefer readability over complex code
- Use async/await only
- Add proper error handling
- Never hardcode secrets
- Use environment variables
- Reuse components and functions

---

# Backend Architecture Rules

Use MVC architecture.

## Structure
/backend
  /controllers
  /models
  /routes
  /middleware
  /services
  /utils
  /ai

## Rules
- Keep routes minimal
- Business logic belongs in controllers/services
- Separate AI logic into /ai or /services
- Validate all incoming requests
- Use middleware for authentication and validation

---

# Frontend Architecture Rules

/frontend
  /components
  /pages
  /layouts
  /hooks
  /services
  /context
  /utils

## Frontend Rules
- Use functional React components
- Keep components reusable
- Keep chat UI responsive
- Separate UI from logic
- Avoid deeply nested components
- Use custom hooks when needed

---

# AI Chatbot Rules

- Chatbot responses should be concise and helpful
- Ask follow-up questions when user requirements are unclear
- Recommend products based on actual specifications
- Prioritize user needs over expensive products
- Maintain conversational flow
- Avoid repetitive chatbot responses

## Example Questions
- What is your budget?
- Do you prefer gaming or office use?
- Which brand do you like?
- Do you need portability or performance?

---

# Recommendation Engine Rules

Recommendations should consider:
- Budget
- CPU/GPU performance
- RAM
- Storage
- Battery life
- Brand preference
- Screen size
- User purpose

## Example Categories
- Gaming
- Student
- Office
- Programming
- Video editing
- Casual use

---

# Database Rules

Use Schema validation.

## Product Model Should Include
- name
- brand
- category
- price
- specs
- images
- rating
- stock
- tags
- recommendationScore

## Rules
- Add timestamps to all models
- Use indexes when needed
- Avoid duplicated queries
- Normalize product data

---

# API Rules

Use RESTful APIs.

## Response Format
The API response from the recommendation engine MUST strictly follow the detailed JSON format defined in `app.py`:
{
  "productName": "...",
  "brand": "...",
  "price": "...",
  "imageUrl": "...",
  "specs": {
    "display": "...",
    "storage": "...",
    "ram": "...",
    "battery": "...",
    "processor": "...",
    "weight": "...",
    "specialFeatures": []
  },
  "reasoning": "...",
  "prosAndCons": {
    "pros": [],
    "cons": []
  },
  "nearbyShops": [
    {"name": "...", "address": "...", "phone": "..."}
  ],
  "alternatives": []
}

## Rules
- Return proper HTTP status codes
- Validate all inputs
- Sanitize user input
- Handle API errors properly

---

# Security Rules

- Store secrets in .env
- Hash passwords using bcrypt or werkzeug
- Protect private routes using JWT
- Prevent XSS and injection attacks
- Never trust frontend validation alone
- Add rate limiting when necessary

---

# React UI Rules

- Keep UI modern and minimal
- Mobile-first responsive design
- Use loading states
- Use skeleton loaders when possible
- Avoid inline styling

---

# Chat UI Rules

- Messages should display clearly
- Separate user and AI messages visually
- Auto-scroll latest messages
- Support typing/loading indicators
- Keep chat experience smooth

---

# Performance Rules

- Lazy load large components
- Optimize API calls
- Use pagination for product lists
- Cache repeated queries if needed
- Optimize Database queries

---

# Code Style Rules

- Use ES Modules
- Use camelCase for variables/functions
- Use PascalCase for React components
- Keep functions focused on one task
- Comment only complex logic

---

# Git Rules

- Write meaningful commit messages
- Keep commits focused
- Never commit .env files
- Use feature branches when possible

---

# AI Agent Behavior

- Analyze existing code before editing
- Follow project structure strictly
- Preserve code consistency
- Avoid rewriting unrelated files
- Ask before major architecture changes
- Reuse existing components/functions whenever possible
