import { ToastContext } from './contexts';
import { useCallback, useMemo, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';


export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, variant = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, variant }]);
  }, []);

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000, position: 'fixed' }}>
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant} onClose={() => dismiss(t.id)} delay={3500} autohide>
            <Toast.Body className={t.variant === 'warning' ? '' : 'text-white'}>{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};
