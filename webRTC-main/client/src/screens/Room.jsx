import "./RoomPage.css";
import React, { useEffect, useCallback, useState, useRef } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const myVideoRef = useRef();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    sendStreams(stream);
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      sendStreams(stream);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(
    (stream = myStream) => {
      if (!stream) return;

      const alreadyAdded = peer.peer.getSenders().map((s) => s.track);
      stream.getTracks().forEach((track) => {
        if (!alreadyAdded.includes(track)) {
          peer.peer.addTrack(track, stream);
        }
      });
    },
    [myStream]
  );

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () =>
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  const handleReceiveMsg = useCallback(({ from, msg }) => {
    setChatMessages((prev) => [...prev, { sender: from, text: msg }]);
  }, []);

  const sendChatMessage = () => {
    if (chatInput.trim()) {
      socket.emit("chat:msg", { to: remoteSocketId, msg: chatInput });
      setChatMessages((prev) => [...prev, { sender: "Me", text: chatInput }]);
      setChatInput("");
    }
  };

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("chat:receive", handleReceiveMsg);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("chat:receive", handleReceiveMsg);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    handleReceiveMsg,
  ]);

  const toggleMic = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      const sender = peer.peer
        .getSenders()
        .find((s) => s.track?.kind === "audio");

      if (audioTrack.enabled) {
        audioTrack.enabled = false;
        if (sender) sender.replaceTrack(null);
        setMicOn(false);
      } else {
        audioTrack.enabled = true;
        if (sender) sender.replaceTrack(audioTrack);
        else peer.peer.addTrack(audioTrack, myStream);
        setMicOn(true);
      }
    }
  };

  const toggleCam = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      const sender = peer.peer
        .getSenders()
        .find((s) => s.track?.kind === "video");

      if (videoTrack.enabled) {
        videoTrack.enabled = false;
        if (sender) sender.replaceTrack(null);
        setCamOn(false);
      } else {
        videoTrack.enabled = true;
        if (sender) sender.replaceTrack(videoTrack);
        else peer.peer.addTrack(videoTrack, myStream);
        setCamOn(true);
      }
    }
  };

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peer.peer
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          const videoTrack = myStream.getVideoTracks()[0];
          if (videoTrack && sender) {
            sender.replaceTrack(videoTrack);
          }
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } else {
        const videoTrack = myStream.getVideoTracks()[0];
        const sender = peer.peer
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const endCall = () => {
    peer.peer.close();
    setRemoteStream(null);
    setMyStream(null);
    setRemoteSocketId(null);
  };

  return (
    <div className="room-container">
      <h1 className="room-header">📹 Apni Video Call</h1>
      <h4 className="room-status">
        {remoteSocketId ? "✅ Connected" : "❌ Waiting for user..."}
      </h4>

      <div className="control-buttons">
        {myStream && <button onClick={sendStreams}>📤 Send Stream</button>}
        {remoteSocketId && <button onClick={handleCallUser}>📞 Call</button>}
        {myStream && (
          <>
            <button onClick={toggleMic}>
              {micOn ? "🔇 Mute Mic" : "🎙️ Unmute Mic"}
            </button>
            <button onClick={toggleCam}>
              {camOn ? "📷 Turn Off Cam" : "📸 Turn On Cam"}
            </button>
            <button onClick={handleScreenShare}>
              {isScreenSharing ? "🛑 Stop Share" : "📺 Share Screen"}
            </button>
            <button className="end" onClick={endCall}>
              ❌ End Call
            </button>
          </>
        )}
      </div>

      <div className="video-section">
        {myStream && (
          <div className="video-box">
            <h3>🎥 My Stream</h3>
            <ReactPlayer
              playing
              muted={!micOn}
              height="200px"
              width="300px"
              url={myStream}
            />
          </div>
        )}
        {remoteStream && (
          <div className="video-box">
            <h3>📺 Remote Stream</h3>
            <ReactPlayer
              playing
              muted={false}
              height="200px"
              width="300px"
              url={remoteStream}
            />
          </div>
        )}
      </div>

      <div className="chat-box">
        <h3>💬 Chat</h3>
        <div className="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx}>
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <input
          className="chat-input"
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="chat-button" onClick={sendChatMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
