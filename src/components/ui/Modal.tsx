'use client';

import { ReactNode, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import IconButton from './IconButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] sm:max-w-[90vw]',
  };

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement?.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement?.focus();
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'hidden';

      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'unset';

      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleEscape, handleTabKey]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'bg-dark-secondary border border-white/10 rounded-2xl w-full max-h-[90vh] overflow-auto animate-slide-up',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <IconButton
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close modal"
              />
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5 nice-scroll">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
