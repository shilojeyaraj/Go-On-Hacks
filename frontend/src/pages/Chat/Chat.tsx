import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatService, ChatMatch, Message as ApiMessage } from '../../services/chat.service';
import './Chat.css';

// Local interface for messages displayed in the component
interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export const Chat: React.FC = () => {
  const { user } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [matches, setMatches] = useState<ChatMatch[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedConversationId && user) {
      loadMessages(selectedConversationId);
      // Set up auto-refresh for messages
      refreshIntervalRef.current = setInterval(() => {
        loadMessages(selectedConversationId);
      }, 3000); // Refresh every 3 seconds

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [selectedConversationId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectChat = (match: ChatMatch) => {
    setSelectedChat(match.id);
    setSelectedConversationId(match.conversationId);
    setMessages([]); // Clear messages while loading
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs: ApiMessage[] = await ChatService.getMessages(conversationId);
      // Transform messages to match component interface
      const transformedMessages: Message[] = msgs.map((msg: ApiMessage) => ({
        id: msg._id,
        senderId: msg.senderId,
        content: msg.content,
        timestamp: msg.createdAt ? ChatService.formatMessageTimeDetailed(msg.createdAt) : '',
        isOwn: msg.senderId === user?.uid,
      }));
      setMessages(transformedMessages);
      
      // Refresh conversations to update last message
      if (user?.uid) {
        const updatedMatches = await ChatService.getChatMatches(user.uid);
        setMatches(updatedMatches);
      }
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadConversations = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const chatMatches = await ChatService.getChatMatches(user.uid);
      setMatches(chatMatches);
      
      // Check if we need to auto-select a conversation (from navigation state)
      const state = location.state as { userId?: string } | null;
      if (state?.userId) {
        // Find conversation with this user
        const match = chatMatches.find(m => m.otherUserId === state.userId);
        if (match) {
          handleSelectChat(match);
        } else {
          // Try to get or create conversation
          try {
            const conversation = await ChatService.getOrCreateConversation(state.userId);
            // Reload matches to include the new conversation
            const updatedMatches = await ChatService.getChatMatches(user.uid);
            setMatches(updatedMatches);
            const newMatch = updatedMatches.find(m => m.otherUserId === state.userId);
            if (newMatch) {
              handleSelectChat(newMatch);
            }
          } catch (err) {
            console.error('Failed to create conversation:', err);
          }
        }
        // Clear navigation state
        navigate(location.pathname, { replace: true, state: {} });
      }
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedConversationId || sending) {
      return;
    }

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      await ChatService.sendMessage(selectedConversationId, content);
      // Reload messages to show the new one
      await loadMessages(selectedConversationId);
      // Refresh conversations to update last message
      if (user?.uid) {
        await loadConversations();
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      // Restore message input on error
      setMessageInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedMatch = matches.find(m => m.id === selectedChat);

  return (
    <>
      <Navigation />
      <div className="chat-container">
        <div className="chat-layout">
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <h2 className="chat-sidebar-title">Matches</h2>
            </div>
            <div className="chat-sidebar-content">
              {loading ? (
                <div className="chat-empty-state">
                  <p className="chat-empty-text">Loading conversations...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="chat-empty-state">
                  <p className="chat-empty-text">no <span className="text-red">feets</span> for you lil bro</p>
                </div>
              ) : (
                <div className="chat-list">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className={`chat-item ${selectedChat === match.id ? 'chat-item--active' : ''}`}
                      onClick={() => handleSelectChat(match)}
                    >
                      <div className="chat-item-avatar">
                        {match.photoURL ? (
                          <img src={match.photoURL} alt={match.name} />
                        ) : (
                          <div className="chat-item-avatar-placeholder">
                            {match.name[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="chat-item-content">
                        <div className="chat-item-header">
                          <span className="chat-item-name">{match.name}</span>
                          {match.lastMessageTime && (
                            <span className="chat-item-time">{match.lastMessageTime}</span>
                          )}
                        </div>
                        {match.lastMessage && (
                          <p className="chat-item-preview">{match.lastMessage}</p>
                        )}
                      </div>
                      {match.unreadCount && match.unreadCount > 0 && (
                        <div className="chat-item-badge">{match.unreadCount}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="chat-main">
            {selectedChat && selectedMatch ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-user">
                    {selectedMatch.photoURL ? (
                      <img
                        src={selectedMatch.photoURL}
                        alt={selectedMatch.name}
                        className="chat-header-avatar"
                      />
                    ) : (
                      <div className="chat-header-avatar chat-header-avatar--placeholder">
                        {selectedMatch.name[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="chat-header-name">{selectedMatch.name}</span>
                  </div>
                </div>
                <div className="chat-messages" ref={messagesContainerRef}>
                  {messages.length === 0 ? (
                    <div className="chat-messages-empty">
                      <p>Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`chat-message ${message.isOwn ? 'chat-message--own' : ''}`}
                        >
                          <p className="chat-message-content">{message.content}</p>
                          <span className="chat-message-time">{message.timestamp}</span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                <form className="chat-input-container" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                  />
                  <button 
                    type="submit"
                    className="chat-send-button"
                    disabled={sending || !messageInput.trim()}
                  >
                    Send
                  </button>
                  {sending && <p className="text-small text-center mt-small" style={{ color: 'var(--text-dark)', fontSize: '0.75rem' }}>Sending...</p>}
                </form>
              </>
            ) : (
              <div className="chat-main-empty">
                <p className="chat-main-empty-text">Select a match to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
