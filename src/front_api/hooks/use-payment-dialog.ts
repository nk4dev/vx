import { useState, useCallback } from 'react';
import type { PaymentDialogControl } from '../../types/payment';

/**
 * React hook that manages open/close state of a payment dialog.
 *
 * @example
 * ```tsx
 * const dialog = usePaymentDialog();
 * // <button onClick={dialog.open}>Pay</button>
 * // {dialog.isOpen && <Payment ... />}
 * ```
 */
export function usePaymentDialog(): PaymentDialogControl {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
