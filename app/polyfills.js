// polyfills.js
import { Platform } from 'react-native';
import 'text-encoding-polyfill';
import "react-native-url-polyfill/auto";
import { Buffer } from 'buffer';
global.Buffer = Buffer;

if (Platform.OS !== 'web') {
  // Needed for Hermes
  if (typeof global.Event === 'undefined') {
    global.Event = class Event {
      constructor(type, options = {}) {
        this.type = type;
        this.bubbles = !!options.bubbles;
        this.cancelable = !!options.cancelable;
      }
    };
  }

  if (typeof global.EventTarget === 'undefined') {
    global.EventTarget = class EventTarget {
      constructor() {
        this.listeners = {};
      }
      addEventListener(type, callback) {
        if (!(type in this.listeners)) {
          this.listeners[type] = [];
        }
        this.listeners[type].push(callback);
      }
      removeEventListener(type, callback) {
        if (!(type in this.listeners)) return;
        const stack = this.listeners[type];
        for (let i = 0, l = stack.length; i < l; i++) {
          if (stack[i] === callback) {
            stack.splice(i, 1);
            return;
          }
        }
      }
      dispatchEvent(event) {
        if (!(event.type in this.listeners)) return true;
        const stack = this.listeners[event.type].slice();
        for (let i = 0, l = stack.length; i < l; i++) {
          stack[i].call(this, event);
        }
        return !event.defaultPrevented;
      }
    };
  }
}