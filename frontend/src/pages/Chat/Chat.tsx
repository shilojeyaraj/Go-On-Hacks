import React, { useState } from 'react';
import { Navigation } from '../../components/Navigation/Navigation';
import { useAuthUser } from '../../hooks/useAuthUser';
import './Chat.css';

interface ChatMatch {
  id: string;
  name: string;
  photoURL?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export const Chat: React.FC = () => {
  const { user } = useAuthUser();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [matches] = useState<ChatMatch[]>([]);
  const [messages] = useState<Message[]>([]);

  const handleSelectChat = (matchId: string) => {
    setSelectedChat(matchId);
  };

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
              {matches.length === 0 ? (
                <div className="chat-empty-state">
                  <p className="chat-empty-text">no feets for you lil bro</p>
                </div>
              ) : (
                <div className="chat-list">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className={`chat-item ${selectedChat === match.id ? 'chat-item--active' : ''}`}
                      onClick={() => handleSelectChat(match.id)}
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
            {selectedChat ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-user">
                    {matches.find(m => m.id === selectedChat)?.photoURL ? (
                      <img
                        src={matches.find(m => m.id === selectedChat)?.photoURL}
                        alt={matches.find(m => m.id === selectedChat)?.name}
                        className="chat-header-avatar"
                      />
                    ) : (
                      <div className="chat-header-avatar chat-header-avatar--placeholder">
                        {matches.find(m => m.id === selectedChat)?.name[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="chat-header-name">
                      {matches.find(m => m.id === selectedChat)?.name}
                    </span>
                  </div>
                </div>
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="chat-messages-empty">
                      <p>Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`chat-message ${message.isOwn ? 'chat-message--own' : ''}`}
                      >
                        <p className="chat-message-content">{message.content}</p>
                        <span className="chat-message-time">{message.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="chat-input-container">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message..."
                  />
                  <button className="chat-send-button">Send</button>
                </div>
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
