import { Config } from "./config-ts";

export function EventEmitter(obj) {
  const events = {};
  const addListener = (event, listener) => {
    if (!(event in events)) events[event] = [];

    const listeners = events[event];
    if (listeners.indexOf(listener) === -1) listeners.push(listener);
  };
  const removeListener = function (event, listener) {
    if (!(event in events)) events[event] = [];

    var listeners = events[event];
    var index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
  const emitEvent = (event, value) => {
    if (event === undefined) {
      if (!Config.debug) console.warn("Sending undefined event!");
      else throw new Error("Sending undefined event!");
    }

    if (!(event in events)) events[event] = [];

    var listeners = events[event];

    for (var i = 0, l = listeners.length; i < l; i++) listeners[i](value);
  };
  const addProps = (obj: any, message: string) => {
    obj.addEventListener = addListener;
    obj.removeEventListener = removeListener;
    obj._emitEvent = emitEvent;
  };
  if (typeof obj === "object") {
    addProps(obj, "object");
  } else if (obj != "global") {
    addProps(obj.prototype, "constructor");
  }

  return obj;
}
