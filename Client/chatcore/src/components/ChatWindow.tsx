import { useState, FormEvent, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { chatService } from '../services/api'
import { signalRService } from '../services/signalR'

export function ChatWindow() {
  const { user } = useAuthStore()
  const { selectedChat, setSelectedChat } = useChatStore()
  const [newMessage, setNewMessage] = useState('')
  const chatHistoryRef = useRef<HTMLDivElement>(null)

  // ESC tuşu için event listener
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedChat(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setSelectedChat])

  // Mesajlar değiştiğinde en alta scroll
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [selectedChat?.messages])

  // Gelen mesajları dinle
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (selectedChat && message.chatId === selectedChat.id) {
        console.log('Yeni mesaj geldi:', message)
        // Store'u güncelle ve yeni mesajı ekle
        useChatStore.setState((state) => {
          const updatedMessages = [...selectedChat.messages, {
            senderId: message.senderId,
            content: message.content,
            sentAt: new Date(message.sentAt)
          }]

          return {
            ...state,
            selectedChat: {
              ...selectedChat,
              messages: updatedMessages
            }
          }
        })
      }
    }

    signalRService.onReceiveMessage(handleMessage)

    return () => {
      const callbacks = (signalRService as any).callbacks.receiveMessage
      if (callbacks.has(handleMessage)) {
        callbacks.delete(handleMessage)
      }
    }
  }, [selectedChat])

  const chatUser = selectedChat?.users.find(u => u.id !== user?.id)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat || !user) return

    try {
      await chatService.sendMessage(selectedChat.id, newMessage)
      setNewMessage('')
    } catch (err) {
      console.error('Mesaj gönderilirken hata:', err)
    }
  }

  if (!selectedChat) {
    return (
      <div className="chat">
        <div className="chat-history">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Sohbet seçilmedi</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat">
      {!selectedChat ? (
        <div className="chat-history">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Sohbet seçilmedi</p>
          </div>
        </div>
      ) : (
        <>
          <div className="chat-header clearfix">
            <div className="row">
              <div className="col-lg-6">
                <img src={selectedChat.isGroupChat 
                  ? "https://cdn.pixabay.com/photo/2017/11/10/05/46/group-2935521_1280.png"
                  : chatUser?.profilePictureUrl} 
                  alt="avatar" 
                />
                <div className="chat-about">
                  <h6 className="m-b-0 font-bold">
                    {selectedChat.isGroupChat ? selectedChat.name : chatUser?.username}
                  </h6>
                  {selectedChat.isGroupChat ? (
                    <small>
                      {selectedChat.users
                        .filter(u => u.id !== user?.id)
                        .map(u => u.username)
                        .join(', ')}
                    </small>
                  ) : (
                    <small>
                      {chatUser?.isOnline 
                        ? 'çevrimiçi'
                        : `Son görülme: ${new Date(chatUser?.lastSeen || '').toLocaleString()}`
                      }
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="chat-history" ref={chatHistoryRef}>
            <ul className="m-b-0">
              {selectedChat.messages?.map((message, index) => (
                <li key={index} className="clearfix">
                  {message.senderId === user?.id ? (
                    <>
                      <div className="message-data text-right">
                        <span className="message-data-time">
                          {new Date(message.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="message other-message float-right">
                        {message.content}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="message-data">
                        <span className="message-data-time">
                          {new Date(message.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="message my-message">
                        {message.content}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="chat-message clearfix">
            <form onSubmit={handleSubmit}>
              <div className="input-group mb-0" style={{ gap: '10px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Mesajınızı yazın..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  <i className="fa fa-send"></i>
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
} 