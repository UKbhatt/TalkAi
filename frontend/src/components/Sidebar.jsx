import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, MessageSquare, ChevronLeft, ChevronRight, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import {
  setActiveConversation,
  setMessages,
  fetchConversations,
  fetchMessages,
  deleteConversation,
  updateConversation
} from '../store/chatSlice';
import { toggleSidebar } from '../store/uiSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { conversations, activeConversation, loading } = useSelector((state) => state.chat);
  const { sidebarCollapsed } = useSelector((state) => state.ui);

  const [hoveredConversation, setHoveredConversation] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [conversationToRename, setConversationToRename] = useState(null);


  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.context-menu-container')) {
        setMenuOpen(null);
      }
      if (showRenameDialog && !event.target.closest('.rename-dialog-container')) {
        setShowRenameDialog(false);
        setRenameValue('');
        setConversationToRename(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, showRenameDialog]);

  const handleNewChat = () => {
    dispatch(setActiveConversation(null));

    if (window.innerWidth < 1024) {
      dispatch(toggleSidebar());
    }
  };

  const handleConversationClick = async (conversationId) => {
    dispatch(setActiveConversation(conversationId));

    try {
      await dispatch(fetchMessages({ conversationId })).unwrap();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }

    if (window.innerWidth < 1024) {
      dispatch(toggleSidebar());
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return 'Just now';
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await dispatch(deleteConversation(conversationId)).unwrap();
        if (activeConversation === conversationId) {
          dispatch(setActiveConversation(null));
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
    setMenuOpen(null);
  };

  const handleRenameConversation = (conversation) => {
    setConversationToRename(conversation);
    setRenameValue(conversation.title);
    setShowRenameDialog(true);
    setMenuOpen(null);
  };

  const handleRenameSubmit = async () => {
    if (renameValue.trim() && conversationToRename) {
      try {
        console.log('Attempting to rename conversation:', conversationToRename.id, 'to:', renameValue.trim());

        await dispatch(updateConversation({
          id: conversationToRename.id,
          title: renameValue.trim()
        })).unwrap();

        console.log('Conversation renamed successfully');
      } catch (error) {
        console.error('Failed to rename conversation:', error);
        alert('Failed to rename conversation. Please try again.');
      }
    }
    setShowRenameDialog(false);
    setRenameValue('');
    setConversationToRename(null);
  };

  const handleMenuClick = (e, conversationId) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === conversationId ? null : conversationId);
  };

  return (
    <div className="h-full bg-white flex flex-col w-full min-h-0">
      <div className={`${sidebarCollapsed ? 'p-1.5' : 'p-3 lg:p-4'} border-b border-gray-200`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center mb-4' : 'justify-between mb-6'}`}>
          {!sidebarCollapsed && <h2 className="text-base font-bold text-gray-900">Conversations</h2>}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        {sidebarCollapsed ? (
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-600 text-white p-1.5 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
        ) : (
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className={`text-center ${sidebarCollapsed ? 'p-1.5' : 'p-6'}`}>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={20} className="text-gray-400" />
            </div>
            {!sidebarCollapsed && <p className="text-gray-500 text-xs font-medium">No conversations yet</p>}
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`relative group rounded-xl transition-all duration-300 ease-in-out ${activeConversation === conversation.id
                    ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                onMouseEnter={() => setHoveredConversation(conversation.id)}
                onMouseLeave={() => setHoveredConversation(null)}
              >
                <button
                  onClick={() => handleConversationClick(conversation.id)}
                  className={`w-full text-left transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'p-1.5 flex justify-center' : 'p-3'
                    }`}
                  title={sidebarCollapsed ? conversation.title : ''}
                >
                  {sidebarCollapsed ? (
                    <div className="w-6 h-6 bg-gray-200 rounded-md flex items-center justify-center">
                      <MessageSquare size={12} className="text-gray-600" />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 min-w-0 pr-12">
                        <h3 className="font-semibold text-gray-900 text-xs truncate mb-1">
                          {conversation.title}
                        </h3>
                        <p className="text-gray-500 text-xs truncate">
                          {conversation.preview}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 pr-8">
                        <span className="text-xs text-gray-400 mt-0.5">
                          {formatTime(conversation.timestamp)}
                        </span>
                      </div>
                    </div>
                  )}
                </button>

                {!sidebarCollapsed && hoveredConversation === conversation.id && (
                  <button
                    onClick={(e) => handleMenuClick(e, conversation.id)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-all duration-200"
                  >
                    <MoreVertical size={16} />
                  </button>
                )}

                {menuOpen === conversation.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(null)}
                    />
                    <div className="context-menu-container absolute right-2 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <button
                        onClick={() => handleRenameConversation(conversation)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <Edit3 size={16} className="text-gray-500" />
                        <span>Rename</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => handleDeleteConversation(conversation.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                      >
                        <Trash2 size={16} className="text-red-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {showRenameDialog && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowRenameDialog(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="rename-dialog-container bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rename Conversation</h3>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Enter new name"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameSubmit();
                    }
                  }}
                />
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowRenameDialog(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRenameSubmit}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Rename
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;