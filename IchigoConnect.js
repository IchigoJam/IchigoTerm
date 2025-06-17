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
  }
  write(s) {
    this.writer.write(new TextEncoder().encode(s));
  }
  async close() {
    await this.reader.cancel();
    this.reader.releaseLock();
    await this.port.readable.cancel();
    await this.writer.close();
    await this.port.close();
    this.port = null;
    this.writer = null;
    this.reader = null;
  }
};
