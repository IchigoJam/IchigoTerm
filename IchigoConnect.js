export class IchigoConnect {
  static async create() {
    const port = await navigator.serial.requestPort();
    const baudRate = 115200;
    await port.open({ baudRate });
    return new IchigoConnect(port);
  }
  constructor(port) {
    this.port = port;
    this.writer = port.writable.getWriter();
    this.reader = port.readable.getReader();
    this.decoder = new TextDecoder();
    this.readBuffer = "";
    this.lines = [];
    this.lineWaiters = [];
    this.closed = false;
    this.sendQueue = Promise.resolve();
    this.readTask = this.readLoop();
  }
  write(s) {
    return this.writer.write(new TextEncoder().encode(s));
  }
  send(s) {
    const result = this.sendQueue.then(async () => {
      this.lines.length = 0;
      this.readBuffer = "";
      await this.write(s);
      await new Promise((resolve) => setTimeout(resolve, 50));
      return (await this.readLines())[0] ?? null;
    });
    this.sendQueue = result.then(() => {}, () => {});
    return result;
  }
  pushLine(line) {
    const value = line.endsWith("\r")
      ? line.substring(0, line.length - 1)
      : line;
    const resolve = this.lineWaiters.shift();
    if (resolve) {
      resolve(value);
    } else {
      this.lines.push(value);
    }
  }
  async readLoop() {
    try {
      for (;;) {
        const { value, done } = await this.reader.read();
        if (done) break;
        this.readBuffer += this.decoder.decode(value, { stream: true });
        for (;;) {
          const newline = this.readBuffer.indexOf("\n");
          if (newline < 0) break;
          this.pushLine(this.readBuffer.substring(0, newline));
          this.readBuffer = this.readBuffer.substring(newline + 1);
        }
      }
      this.readBuffer += this.decoder.decode();
      if (this.readBuffer) {
        this.pushLine(this.readBuffer);
        this.readBuffer = "";
      }
    } catch (e) {
      if (!this.closed) console.error(e);
    } finally {
      this.closed = true;
      for (const resolve of this.lineWaiters.splice(0)) {
        resolve(null);
      }
    }
  }
  readLine() {
    if (this.lines.length > 0) return Promise.resolve(this.lines.shift());
    if (this.closed) return Promise.resolve(null);
    return new Promise((resolve) => this.lineWaiters.push(resolve));
  }
  async readLines() {
    const first = await this.readLine();
    if (first == null) return [];
    return [first, ...this.lines.splice(0)];
  }
  async close() {
    this.closed = true;
    await this.reader.cancel();
    await this.readTask;
    this.reader.releaseLock();
    await this.port.readable.cancel();
    await this.writer.close();
    await this.port.close();
    this.port = null;
    this.writer = null;
    this.reader = null;
    this.decoder = null;
    this.readBuffer = null;
    this.lines = null;
    this.lineWaiters = null;
    this.sendQueue = null;
    this.readTask = null;
  }
}

let ic = null;
const connect = async () => {
  if (ic == null) ic = await IchigoConnect.create();
  return ic;
};
export const send = async (s) => {
  return (await connect()).send(s);
};
export const readLine = async (s) => {
  return (await connect()).readLine();
};
