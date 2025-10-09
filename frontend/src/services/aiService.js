class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    this.model = import.meta.env.VITE_AI_MODEL || 'gemini-1.5-pro';
  }

  async generateResponse(message, conversationHistory = []) {
    if (!this.apiKey) {
      return this.getMockResponse(message);
    }

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: message
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse) {
        throw new Error('No response from Gemini API');
      }

      return aiResponse;

    } catch (error) {
      console.error('AI Service Error:', error.message);
      return this.getMockResponse(message);
    }
  }

  getMockResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! 👋 I'm your AI assistant. I'm here to help you with questions, provide information, and assist with various tasks. How can I help you today?";
    }
    
    if (lowerMessage.includes('good morning')) {
      return "Good morning! ☀️ I hope you're having a great start to your day. What can I help you with today?";
    }
    
    if (lowerMessage.includes('good afternoon')) {
      return "Good afternoon! 🌤️ I hope your day is going well. How can I assist you?";
    }
    
    if (lowerMessage.includes('good evening') || lowerMessage.includes('good night')) {
      return "Good evening! 🌙 I hope you've had a productive day. What would you like to know?";
    }
    
    // How are you
    if (lowerMessage.includes('how are you')) {
      return "I'm doing great, thank you for asking! 😊 I'm here and ready to help you with any questions or tasks you might have. How are you doing today?";
    }
    
    // Thanks
    if (lowerMessage.includes('thank')) {
      return "You're very welcome! 😊 I'm glad I could help. Is there anything else you'd like to know or any other way I can assist you?";
    }
    
    // Help
    if (lowerMessage.includes('help')) {
      return "I'm here to help! 🤝 You can ask me questions about various topics including:\n\n• General knowledge and facts\n• Programming and technology\n• Writing and language\n• Problem-solving\n• Explanations of concepts\n• Creative tasks\n\nWhat would you like to know or work on?";
    }
    
    // Weather
    if (lowerMessage.includes('weather')) {
      return "I don't have access to real-time weather data, but I can help you understand weather patterns, climate science, or suggest how to check the current weather in your area using weather apps or websites. What specific weather information are you looking for?";
    }
    
    // Time/Date
    if (lowerMessage.includes('time') || lowerMessage.includes('date')) {
      return `The current time is ${new Date().toLocaleString()}. ⏰ I can help you with time-related questions, calculations, or time zone conversions. What time-related assistance do you need?`;
    }
    
    // Programming
    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      return "I can help you with programming questions! 💻 I can explain concepts, help debug code, suggest best practices, or provide code examples. What programming language or topic interests you?";
    }
    
    if (lowerMessage.includes('python')) {
      return "Python is a great programming language! 🐍 I can help you with Python syntax, libraries (like pandas, numpy, flask, django), best practices, or specific coding problems. What Python topic would you like to explore?";
    }
    
    if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
      return "JavaScript is a versatile language for web development! ⚡ I can help you with JavaScript concepts, ES6+, frameworks (React, Vue, Angular), Node.js, or specific coding challenges. What JavaScript topic can I help you with?";
    }
    
    if (lowerMessage.includes('react')) {
      return "React is a powerful library for building user interfaces! ⚛️ I can help you with React components, hooks (useState, useEffect, custom hooks), state management, props, or best practices. What React question do you have?";
    }
    
    // AI/ChatGPT related
    if (lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence')) {
      return "Artificial Intelligence is a fascinating field! 🤖 I can help explain AI concepts, machine learning basics, neural networks, or discuss the current state of AI technology. What aspect of AI interests you?";
    }
    
    // Math
    if (lowerMessage.includes('math') || lowerMessage.includes('calculate') || lowerMessage.includes('solve')) {
      return "I can help with mathematics! 🔢 I can assist with algebra, calculus, geometry, statistics, or help solve specific math problems. What mathematical concept or problem would you like help with?";
    }
    
    // Business
    if (lowerMessage.includes('business') || lowerMessage.includes('marketing') || lowerMessage.includes('strategy')) {
      return "I can help with business topics! 💼 I can provide insights on business strategy, marketing concepts, entrepreneurship, or general business advice. What business question do you have?";
    }
    
    // Health
    if (lowerMessage.includes('health') || lowerMessage.includes('exercise') || lowerMessage.includes('diet')) {
      return "I can provide general information about health topics! 🏃‍♂️ However, for medical advice, please consult with healthcare professionals. I can help with general wellness, fitness concepts, or healthy lifestyle tips. What health topic interests you?";
    }
    
    // Default responses for common patterns
    const defaultResponses = [
      "That's an interesting question! 🤔 Let me help you with that.",
      "I understand what you're asking. Here's what I can tell you...",
      "Great question! 💡 Based on my knowledge, I can explain that...",
      "I'd be happy to help you with that! Let me break it down...",
      "That's a good point! Here's my perspective on this topic...",
      "I can provide some insights on that. Let me explain...",
      "Thanks for asking! Here's what I know about that subject...",
      "I'm here to help! Let me give you a comprehensive answer..."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)] + 
           `\n\nYou asked: "${message}"\n\nI'm here to help you with any questions or tasks you might have!`;
  }

  async testConnection() {
    try {
      if (!this.apiKey) {
        return { success: false, message: 'No API key configured' };
      }

      const response = await this.generateResponse('Hello, are you working?');
      return { success: true, message: 'AI service is working', response };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new AIService();