import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../services/socket';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';
import ChatSidebar from '../components/ChatSidebar';
import { useBoard } from '../hooks/useBoard';
import { useChat } from '../hooks/useChat';

export default function BoardView() {
  const { boardId } = useParams();
  const { elements, addElement, updateElement, removeElement } = useBoard(boardId);

  const [userName, setUserName] = useState('');
  useEffect(() => {
    if (socket.connected) setUserName(socket.id);
    else {
      socket.on('connect', () => setUserName(socket.id));
    }
  }, []);

  const { messages, sendMessage } = useChat(boardId, userName);
  const [tool, setTool] = useState('select');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      <Toolbar onToolSelect={setTool} onToggleChat={() => setChatOpen(o => !o)} />
      <div className="relative flex-1">
        <Canvas
          className="absolute inset-0 w-full h-full"
          elements={elements}
          onAdd={addElement}
          onMove={updateElement}
          onRemove={removeElement}
          tool={tool}
        />
      </div>
      {chatOpen && (
        <ChatSidebar
          messages={messages}
          onSend={sendMessage}
          onClose={() => setChatOpen(false)}
          currentUser={userName}
        />
      )}
    </div>
  );
}