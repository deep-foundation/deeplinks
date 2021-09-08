import { createContext, useContext } from "react";
import { EventEmitter } from "events";

export const ClickEmitterContext = createContext<EventEmitter>(new EventEmitter());

export function useClickEmitter() {
  return useContext(ClickEmitterContext);
}