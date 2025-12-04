import io from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js";

class opensockit {
  constructor(url = 'https://opensockit.onrender.com') {
    this.url = url;
    this.socket = null;
    this.token = null;
    this.interval = null;
    this.isManualDisconnect = false;
  }

  async connect() {
    const res = await fetch(`${this.url}/token?domain=${encodeURIComponent(window.location.origin)}`);
    this.token = await res.text();
    this.socket = io(this.url);
    this.socket.emit('token', this.token);
    
    // Set up disconnect handler for automatic reconnection
    this.socket.on('disconnect', () => {
      if (!this.isManualDisconnect) {
        console.log('Disconnected, attempting to reconnect...');
        this.reconnect();
      }
    });

    return new Promise((resolve, reject) => {
      this.socket.on('token', (msg) => {
        if (msg === 'connected') {
          this.interval = setInterval(() => {
            fetch(`${this.url}/tokenupdate?token=${this.token}&domain=${encodeURIComponent(window.location.origin)}`);
          }, 5000);
          resolve();
        }
      });
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
  }

  async reconnect() {
    if (this.interval) clearInterval(this.interval);
    if (this.socket) this.socket.removeAllListeners();
    
    try {
      await this.connect();
      console.log('Reconnected successfully');
    } catch (error) {
      console.error('Reconnection failed, retrying in 3 seconds...', error);
      setTimeout(() => this.reconnect(), 3000);
    }
  }

  disconnect() {
    this.isManualDisconnect = true;
    if (this.interval) clearInterval(this.interval);
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
  }

  getSocket() {
    return this.socket;
  }

  send(event = 'message', data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export default opensockit;
