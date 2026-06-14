import React, { useState, useRef, useEffect } from "react";
import "./ChatInterface.css";

function ChatInterface({ onSubmit, isLoading }) {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "Hi! 👋 I'm Aiycom. Tell me what you're looking for!\n\nYou can type something like:\n• \"I need a smartphone under $500 for photography\"\n• \"Looking for a gaming laptop around $1500\"\n• \"Best tablet for students under $400\"",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseUserInput = (text) => {
    const lowerText = text.toLowerCase();
    
    // Device detection
    let device = "Smartphone";
    if (lowerText.includes("laptop")) device = "Laptop";
    else if (lowerText.includes("notebook")) device = "Notebook";
    else if (lowerText.includes("tablet") || lowerText.includes("ipad")) device = "Tablet";
    else if (lowerText.includes("gaming pc") || lowerText.includes("desktop") || lowerText.includes("pc")) device = "Gaming PC";
    else if (lowerText.includes("phone") || lowerText.includes("smartphone") || lowerText.includes("iphone") || lowerText.includes("android")) device = "Smartphone";

    // Budget detection
    let budget = "Under $300";
    const priceMatch = text.match(/\$?\s*(\d{1,5})/);
    if (priceMatch) {
      const price = parseInt(priceMatch[1]);
      if (price < 300) budget = "Under $300";
      else if (price <= 600) budget = "$300–$600";
      else if (price <= 1000) budget = "$600–$1000";
      else if (price <= 1500) budget = "$1000–$1500";
      else if (price <= 2000) budget = "$1500–$2000";
      else budget = "$2000+";
    }

    // Purpose detection
    let purpose = "General";
    if (lowerText.includes("gaming") || lowerText.includes("game")) purpose = "Gaming";
    else if (lowerText.includes("photo") || lowerText.includes("video") || lowerText.includes("camera")) purpose = "Photography/Videography";
    else if (lowerText.includes("work") || lowerText.includes("office") || lowerText.includes("productivity")) purpose = "Office/Productivity";
    else if (lowerText.includes("student") || lowerText.includes("school") || lowerText.includes("study") || lowerText.includes("education")) purpose = "Student/Education";
    else if (lowerText.includes("travel") || lowerText.includes("portable") || lowerText.includes("light")) purpose = "Travel/Portability";
    else if (lowerText.includes("content") || lowerText.includes("creator") || lowerText.includes("youtube")) purpose = "Content Creation";
    else if (lowerText.includes("coding") || lowerText.includes("programming") || lowerText.includes("developer")) purpose = "Software Development";

    // Brand detection
    let brand = "No preference";
    const brands = ["apple", "samsung", "google", "oneplus", "xiaomi", "sony", "dell", "hp", "lenovo", "asus", "acer", "microsoft", "msi", "razer"];
    for (const b of brands) {
      if (lowerText.includes(b)) {
        brand = b.charAt(0).toUpperCase() + b.slice(1);
        break;
      }
    }

    // City detection (look for "in [city]" or "near [city]")
    let city = "";
    const cityMatch = text.match(/(?:in|near|at|from)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.)/);
    if (cityMatch) {
      city = cityMatch[1].trim();
    }

    return {
      device,
      budget,
      purpose,
      brand,
      city,
      screenSize: "No preference",
      storage: "No preference",
      ram: "No preference",
      batteryLife: "No preference",
      weightPriority: "No preference",
      specialFeatures: [],
      rawQuery: text,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    setInputText("");

    // Parse the user input
    const parsedData = parseUserInput(userMessage);

    // Add thinking message
    setMessages((prev) => [...prev, { type: "bot", content: "🔍 Searching for the perfect device...", isLoading: true }]);

    // Call the API
    onSubmit(parsedData);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type} ${msg.isLoading ? "loading" : ""}`}>
            <div className="message-bubble">
              {msg.content.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.content.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tell me what device you're looking for..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputText.trim()}>
          {isLoading ? "..." : "➤"}
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
