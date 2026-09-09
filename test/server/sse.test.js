'use strict';

const { SseHub } = require('../../dist/server/sse');

function fakeRes() {
  const handlers = {};
  return {
    written: [],
    headers: null,
    writeHead(status, h) {
      this.headers = h;
    },
    write(chunk) {
      this.written.push(chunk);
    },
    on(event, cb) {
      handlers[event] = cb;
    },
    emit(event) {
      handlers[event]?.();
    },
  };
}

describe('SseHub', () => {
  it('sends SSE headers and a priming newline on add', () => {
    const hub = new SseHub();
    const res = fakeRes();
    hub.add(res);
    expect(res.headers['Content-Type']).toBe('text/event-stream');
    expect(res.written).toEqual(['\n']);
    expect(hub.size).toBe(1);
  });

  it('broadcasts a named event frame to every client', () => {
    const hub = new SseHub();
    const a = fakeRes();
    const b = fakeRes();
    hub.add(a);
    hub.add(b);
    hub.broadcast('block', { blockNumber: 12 });
    const frame = 'event: block\ndata: {"blockNumber":12}\n\n';
    expect(a.written).toContain(frame);
    expect(b.written).toContain(frame);
  });

  it('drops a client when its socket closes', () => {
    const hub = new SseHub();
    const res = fakeRes();
    hub.add(res);
    expect(hub.size).toBe(1);
    res.emit('close');
    expect(hub.size).toBe(0);
  });

  it('drops a client whose write throws during broadcast', () => {
    const hub = new SseHub();
    const good = fakeRes();
    const bad = fakeRes();
    hub.add(good);
    hub.add(bad);
    expect(hub.size).toBe(2);
    bad.write = () => {
      throw new Error('EPIPE');
    };
    hub.broadcast('x', {});
    expect(hub.size).toBe(1);
  });

  it('ignores a client that is already gone on add', () => {
    const hub = new SseHub();
    const dead = fakeRes();
    dead.write = () => {
      throw new Error('EPIPE');
    };
    hub.add(dead);
    expect(hub.size).toBe(0);
  });
});
