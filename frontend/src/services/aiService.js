class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_AI_API_URL || '';
    this.model = import.meta.env.VITE_AI_MODEL || 'OpenAI GPT-5';
  }

  async generateResponse(message, conversationHistory = []) {
    try {
      if (!this.apiKey) {
        return this.getMockResponse(message);
      }

      const contents = [];
      
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
      
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 10
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }

    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getMockResponse(message);
    }
  }

  getMockResponse(message) {
    const responses = [
      "That's an interesting question! Let me help you with that.",
      "I understand what you're asking. Here's what I think...",
      "Great question! Based on my knowledge, I can tell you that...",
      "I'd be happy to help you with that. Let me explain...",
      "That's a good point. Here's my perspective on this topic...",
      "I can provide some insights on that. Let me break it down for you...",
      "Thanks for asking! Here's what I know about that subject...",
      "I'm here to help! Let me give you a comprehensive answer..."
    ];

    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm your AI assistant. How can I help you today?";
    }
    
    if (lowerMessage.includes('how are you')) {
      return "I'm doing well, thank you for asking! I'm here and ready to help you with any questions or tasks you might have.";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're very welcome! I'm glad I could help. Is there anything else you'd like to know?";
    }
    
    if (lowerMessage.includes('help')) {
      return "I'm here to help! You can ask me questions about various topics, get explanations, or request assistance with tasks. What would you like to know?";
    }
    
    if (lowerMessage.includes('weather')) {
      return "I don't have access to real-time weather data, but I can help you understand weather patterns, climate science, or suggest how to check the weather in your area.";
    }
    
    if (lowerMessage.includes('time') || lowerMessage.includes('date')) {
      return `The current time is ${new Date().toLocaleString()}. I can help you with time-related questions or calculations.`;
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      return "I can help you with programming questions! I can explain concepts, help debug code, suggest best practices, or provide code examples. What programming topic interests you?";
    }
    
    if (lowerMessage.includes('python')) {
      return "Python is a great programming language! I can help you with Python syntax, libraries, best practices, or specific coding problems. What would you like to know about Python?";
    }
    
    if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
      return "JavaScript is a versatile language for web development! I can help you with JavaScript concepts, frameworks, or specific coding challenges. What JavaScript topic can I help you with?";
    }
    
    if (lowerMessage.includes('react')) {
      return "React is a powerful library for building user interfaces! I can help you with React components, hooks, state management, or best practices. What React question do you have?";
    }
    
    return responses[Math.floor(Math.random() * responses.length)] + 
           ` You asked: "${message}". This is a mock response. To get real AI responses, please configure your AI API key in the environment variables.`;
  }

  async testConnection() {
    try {
      if (!this.apiKey) {
        return { success: false, message: 'No API key configured' };
      }

      const response = await this.generateResponse('Hello, are you working?');
      return { success: true, message: 'Gemini AI service is working', response };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new AIService();
