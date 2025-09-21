import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, User, Bot, Sparkles, Search, Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Pause } from 'lucide-react';
import { addMessage, setTyping, addConversation, setActiveConversation } from '../store/chatSlice';
import { updateCredits } from '../store/authSlice';
import aiService from '../services/aiService';

const ChatArea = () => {
  const dispatch = useDispatch();
  const { messages, activeConversation, isTyping, conversations } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [inputValue, setInputValue] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [likedMessageId, setLikedMessageId] = useState(null);
  const [dislikedMessageId, setDislikedMessageId] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const aiResponseRef = useRef(null);

  const suggestedPrompts = [
    'Explain quantum computing in simple terms',
    'Write a Python function to sort a list',
    'What are the benefits of meditation?',
    'Help me plan a weekend trip to Paris',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString(),
      conversationId: activeConversation,
    };

    // create new conversation
    if (!activeConversation) {
      const newConversation = {
        id: Date.now(),
        title: inputValue.substring(0, 50) + (inputValue.length > 50 ? '...' : ''),
        timestamp: new Date().toISOString(),
        preview: inputValue.substring(0, 100),
      };
      dispatch(addConversation(newConversation));
      dispatch(setActiveConversation(newConversation.id));
      userMessage.conversationId = newConversation.id;
    }

    dispatch(addMessage(userMessage));
    setInputValue('');
    console.log('Setting typing to true');
    dispatch(setTyping(true));

    const currentCredits = user?.credits || 1250;
    dispatch(updateCredits(currentCredits - 1));

    try {
      const conversationHistory = conversationMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const aiResponsePromise = aiService.generateResponse(inputValue, conversationHistory);
      aiResponseRef.current = aiResponsePromise;

      const aiResponse = await aiResponsePromise;
      
      if (isPaused) {
        dispatch(setTyping(false));
        return;
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        conversationId: activeConversation || userMessage.conversationId,
      };
      
      dispatch(addMessage(aiMessage));
    } catch (error) {
      if (isPaused) {
        console.log('AI response was paused');
        dispatch(setTyping(false));
        return;
      }
      console.error('AI response error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        conversationId: activeConversation || userMessage.conversationId,
      };
      dispatch(addMessage(errorMessage));
    } finally {
      console.log('Setting typing to false');
      dispatch(setTyping(false));
      setIsPaused(false);
      aiResponseRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt) => {
    setInputValue(prompt);
  };

  const handleCopyMessage = async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleLikeMessage = (messageId) => {
    setLikedMessageId(messageId);
    setTimeout(() => setLikedMessageId(null), 2000);
  };

  const handleDislikeMessage = (messageId) => {
    setDislikedMessageId(messageId);
    setTimeout(() => setDislikedMessageId(null), 2000);
  };

  const handleMouseEnter = (messageId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredMessageId(messageId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMessageId(null);
    }, 2000); // Hide after 2 seconds
  };

  const handlePause = () => {
    if (isTyping) {
      setIsPaused(true);
      dispatch(setTyping(false));
      if (aiResponseRef.current) {
        console.log('Pausing AI response');
      }
    }
  };

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const conversationMessages = messages.filter(m => m.conversationId === activeConversation);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
      <div className="flex-1 overflow-y-auto">
        {conversationMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 lg:p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <Sparkles size={28} className="text-white" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">Welcome to AI Chat</h2>
            <p className="text-gray-600 mb-8 max-w-md text-sm lg:text-base leading-relaxed">
              Start a conversation with our AI assistant. Ask questions, get help with tasks, or explore ideas together.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="p-4 text-left border border-gray-200 rounded-xl hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-blue-200 transition-colors duration-200">
                      <Bot size={12} className="text-blue-600" />
                    </div>
                    <span className="text-gray-700 text-xs font-medium leading-relaxed">{prompt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 lg:p-6 space-y-4 max-w-3xl mx-auto w-full">
            {conversationMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-4 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
                onMouseEnter={() => message.sender === 'ai' && handleMouseEnter(message.id)}
                onMouseLeave={() => message.sender === 'ai' && handleMouseLeave()}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot size={12} className="text-white" />
                  </div>
                )}
                
                <div className={`max-w-xl ${message.sender === 'user' ? 'order-first' : ''}`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xs font-semibold text-gray-900">
                      {message.sender === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className={`p-3 lg:p-4 rounded-xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-100'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                  </div>
                  
                  {message.sender === 'ai' && (
                    <div className="flex items-center space-x-1.5 mt-2 opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                          copiedMessageId === message.id
                            ? 'text-blue-600 bg-blue-100'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Copy message"
                      >
                          <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleLikeMessage(message.id)}
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                          likedMessageId === message.id
                            ? 'text-green-600 bg-green-100'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title="Good response"
                      >
                          <ThumbsUp size={12} />
                      </button>
                      <button
                        onClick={() => handleDislikeMessage(message.id)}
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                          dislikedMessageId === message.id
                            ? 'text-red-600 bg-red-100'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Poor response"
                      >
                          <ThumbsDown size={12} />
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
                        title="More options"
                      >
                        <MoreHorizontal size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User size={12} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gray-100 rounded-2xl border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="w-full pl-10 pr-14 py-3 bg-transparent border-none resize-none focus:outline-none text-gray-900 placeholder-gray-500 text-base leading-relaxed"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '160px' }}
              maxLength={2000}
            />
            {isTyping ? (
              <button
                onClick={handlePause}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Pause AI response"
              >
                <Pause size={16} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Send size={16} />
              </button>
            )}
          </div>
          <div className="flex justify-between items-center mt-3 text-xs text-gray-500 px-2">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className={inputValue.length > 1800 ? 'text-orange-500' : ''}>{inputValue.length}/2000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;