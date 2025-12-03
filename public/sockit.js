import io from './socket.io.esm.min.js';

class Sockit {
  constructor(url = window.location.origin) {
    this.url = url;
    this.socket = null;
    this.token = null;
    this.interval = null;
  }

  async connect() {
    try {
      // Fetch token
      const res = await fetch(`${this.url}/token`);
      this.token = await res.text();

      // Connect socket
      this.socket = io(this.url);

      // Send token
      this.socket.emit('token', this.token);

      // Wait for connection confirmation
      return new Promise((resolve, reject) => {
        this.socket.on('token', (msg) => {
          if (msg === 'connected') {
            // Start updating token every 5 seconds to keep session alive
            this.interval = setInterval(() => {
              fetch(`${this.url}/tokenupdate?token=${this.token}`);
            }, 5000);
            resolve();
          }
        });

        // Timeout if no response
        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
      });
    } catch (error) {
      throw error;
    }
  }

  disconnect() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Expose socket for custom events
  getSocket() {
    return this.socket;
  }
}

export default Sockit;
