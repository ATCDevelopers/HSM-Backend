import {useEffect, useState} from "react";
import {createPortal} from "react-dom";
import Alert from "./Alert";
import {toastBus} from "../../../services/toast";

/**
 * Toaster — floating, top-right stack of auto-dismissing toasts.
 *
 * Mounted once near the app root. Subscribes to the toast bus, so a toast can be
 * raised from anywhere (including the axios interceptor). Each toast removes
 * itself after its duration (success defaults to 3s). Rendered via a portal to
 * document.body with a very high z-index so it always sits in front.
 */
function Toaster() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        return toastBus.subscribe((item) => {
            setToasts((prev) => [...prev, item]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== item.id));
            }, item.duration ?? 3000);
        });
    }, []);

    const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    if (toasts.length === 0) return null;

    return createPortal(
        <div
            className="fixed top-4 right-4 z-[9999] flex w-80 max-w-[90vw] flex-col gap-2">
            {toasts.map((t) => (
                <div key={t.id}
                     className="rounded-lg bg-white shadow-lg ring-1 ring-black/5">
                    <Alert type={t.type} message={t.message} dismissible
                           onDismiss={() => dismiss(t.id)}/>
                </div>
            ))}
        </div>,
        document.body,
    );
}

export default Toaster;
