// src/service/peer.js
class PeerService {
  constructor() {
    this.initPeer();
  }

  initPeer() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE Candidate:", event.candidate);
      }
    };

    this.peer.ontrack = (event) => {
      console.log("📥 Received track:", event.track.kind);
    };
  }

  async getOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setLocalDescription(ans) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
  }

  addTracks(stream) {
    stream.getTracks().forEach((track) => {
      console.log(`🔗 Adding track (${track.kind})`, track);
      this.peer.addTrack(track, stream);
    });
  }

  replaceVideoTrack(newTrack) {
    const sender = this.peer
      .getSenders()
      .find((s) => s.track && s.track.kind === "video");
    if (sender) {
      sender.replaceTrack(newTrack);
    }
  }

  close() {
    this.peer.getSenders().forEach((sender) => {
      try {
        sender.track?.stop();
        this.peer.removeTrack(sender);
      } catch (e) {
        console.warn("Error closing sender:", e);
      }
    });
    this.peer.close();
    this.initPeer();
  }
}

export default new PeerService();
