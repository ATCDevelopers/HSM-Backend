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

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
    duration: number;
}

type ToastListener = (item: ToastItem) => void;

let listeners: ToastListener[] = [];
let nextId = 0;

const emit = (type: ToastType, message: string, duration: number): void => {
    if (!message) return;
    const item: ToastItem = {id: ++nextId, type, message, duration};
    listeners.forEach((listener) => listener(item));
};

export const toastBus = {
    subscribe(listener: ToastListener): () => void {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter((l) => l !== listener);
        };
    },
};

export const toast = {
    success: (message: string, duration: number = 3000): void => emit("success", message, duration),
    error: (message: string, duration: number = 5000): void => emit("error", message, duration),
    info: (message: string, duration: number = 3000): void => emit("info", message, duration),
    warning: (message: string, duration: number = 4000): void => emit("warning", message, duration),
};
