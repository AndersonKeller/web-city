import { EventEmitter } from "./eventEmitter-ts";

export const miscUtilsController = {
  clamp(value: number, min: number, max: number): number {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  },
  makeConstantDescriptor(value: number | string) {
    return {
      configurable: false,
      enumerable: false,
      writeable: false,
      value,
    };
  },
  normaliseDOMid(id: string) {
    return (id[0] !== "#" ? "#" : "") + id;
  },
  reflectEvent(message, value): void {
    this._emitEvent(message, value);
  },
  _emitEvent(message, value): void {
    EventEmitter(this);
    return;
  },
};
