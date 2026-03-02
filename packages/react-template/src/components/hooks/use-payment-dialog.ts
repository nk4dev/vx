import { useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PaymentDialogControl {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/* ------------------------------------------------------------------ */
/*  usePaymentDialog                                                   */
/* ------------------------------------------------------------------ */

/**
 * Hook that manages open/close state of a payment dialog.
 *
 * @example
 * ```tsx
 * const dialog = usePaymentDialog();
 *
 * return (
 *   <>
 *     <button onClick={dialog.open}>Pay</button>
 *     {dialog.isOpen && <Payment to="0x..." amount="0.01" />}
 *   </>
 * );
 * ```
 */
export function usePaymentDialog(): PaymentDialogControl {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
