import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../services/api';


const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  isTyping: false,
  loading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getConversations();
      return response.conversations;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (title, { rejectWithValue }) => {
    try {
      const response = await apiService.createConversation(title);
      return response.conversation;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await apiService.getMessages(conversationId, page, limit);
      return { conversationId, messages: response.messages };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, content }, { rejectWithValue }) => {
    try {
      const response = await apiService.sendMessage(conversationId, content);
      return {
        userMessage: response.userMessage,
        aiMessage: response.aiMessage,
        credits: response.credits
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await apiService.deleteConversation(conversationId);
      return conversationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateConversation = createAsyncThunk(
  'chat/updateConversation',
  async ({ id, title }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateConversation(id, title);
      return response.conversation;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    addConversation: (state, action) => {
      state.conversations.push(action.payload);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAllChatData: (state) => {
      state.conversations = [];
      state.activeConversation = null;
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations.unshift(action.payload);
        state.activeConversation = action.payload.id;
        state.error = null;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        state.messages.push({
          id: action.payload.userMessage.id,
          content: action.payload.userMessage.content,
          role: action.payload.userMessage.role,
          createdAt: action.payload.userMessage.createdAt
        });
        state.messages.push({
          id: action.payload.aiMessage.id,
          content: action.payload.aiMessage.content,
          role: action.payload.aiMessage.role,
          createdAt: action.payload.aiMessage.createdAt,
          metadata: action.payload.aiMessage.metadata
        });
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isTyping = false;
        state.error = action.payload;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          conv => conv.id !== action.payload
        );
        if (state.activeConversation === action.payload) {
          state.activeConversation = null;
          state.messages = [];
        }
      })
      .addCase(updateConversation.fulfilled, (state, action) => {
        console.log('updateConversation.fulfilled:', action.payload);
        const index = state.conversations.findIndex(
          conv => conv.id === action.payload.id
        );
        if (index !== -1) {
          state.conversations[index] = { ...state.conversations[index], ...action.payload };
          console.log('Updated conversation in state:', state.conversations[index]);
        } else {
          console.log('Conversation not found in state for ID:', action.payload.id);
        }
      });
  },
});

export const {
  setConversations,
  setActiveConversation,
  setMessages,
  addMessage,
  addConversation,
  setTyping,
  clearError,
  clearAllChatData
} = chatSlice.actions;
export default chatSlice.reducer;