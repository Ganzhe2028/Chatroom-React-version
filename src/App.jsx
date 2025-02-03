import React, { useState, useEffect, useRef } from "react";

const App = () => {
  const [username, setUsername] = useState(
    localStorage.getItem("chatUsername") || ""
  );
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (username) {
      setIsLoggedIn(true);
      connectWebSocket();
    }
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host =
      window.location.hostname === "localhost"
        ? window.location.hostname
        : window.location.hostname.split(":")[0];
    const port = 8081;
    const ws = new WebSocket(`${protocol}//${host}:${port}`);

    ws.onopen = () => {
      setIsConnected(true);
      addSystemMessage("已连接到聊天室");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "history") {
        setMessages(data.messages);
      } else {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      addSystemMessage("连接已断开");
    };

    setSocket(ws);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem("chatUsername", username);
      setIsLoggedIn(true);
      connectWebSocket();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chatUsername");
    setUsername("");
    setIsLoggedIn(false);
    if (socket) {
      socket.close();
    }
    setMessages([]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!isConnected) {
      addSystemMessage(
        "发送失败：未连接到服务器，请等待连接建立或刷新页面重试"
      );
      return;
    }
    if (messageInput.trim() && socket) {
      try {
        const message = {
          username,
          content: messageInput.trim(),
          time: new Date().toLocaleTimeString(),
        };
        socket.send(JSON.stringify(message));
        setMessageInput("");
      } catch (error) {
        addSystemMessage("发送失败：" + error.message);
      }
    }
  };

  const addSystemMessage = (content) => {
    const systemMessage = {
      username: "系统",
      content,
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  };

  const clearChatHistory = () => {
    setMessages([]);
    addSystemMessage("已清屏");
  };

  if (!isLoggedIn) {
    return (
      <div className="container">
        <form className="login" onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            required
          />
          <button type="submit">加入聊天室</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="chat">
        <div className="chat-header">
          <button className="clear-btn" onClick={clearChatHistory}>
            清屏
          </button>
        </div>
        <div className="messages" ref={messagesRef}>
          {messages.map((message, index) => (
            <div key={index} className="message">
              <span className="username">{message.username}</span>
              <span className="time">{message.time}</span>
              <div className="content">{message.content}</div>
            </div>
          ))}
        </div>
        <form className="input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="输入消息..."
          />
          <button type="submit">发送</button>
        </form>
      </div>
      <div className="logout-container">
        <button className="logout-btn" onClick={handleLogout}>
          登出
        </button>
      </div>
    </div>
  );
};

export default App;
