/**
 * Tiny framework-agnostic toast bus.
 *
 * Lets any code (including the axios interceptor, which lives outside React)
 * raise a toast. The <Toaster /> component subscribes to this bus and renders
 * the toasts. Use the `toast` helpers anywhere:
 *
 *   import { toast } from "../services/toast";
 *   toast.success("Saved!");
 */
let listeners = [];
let nextId = 0;

const emit = (type, message, duration) => {
    if (!message) return;
    const item = {id: ++nextId, type, message, duration};
    listeners.forEach((listener) => listener(item));
};

export const toastBus = {
    subscribe(listener) {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter((l) => l !== listener);
        };
    },
};

export const toast = {
    success: (message, duration = 3000) => emit("success", message, duration),
    error: (message, duration = 5000) => emit("error", message, duration),
    info: (message, duration = 3000) => emit("info", message, duration),
    warning: (message, duration = 4000) => emit("warning", message, duration),
};
