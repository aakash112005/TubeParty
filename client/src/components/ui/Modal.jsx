import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, description, size = 'md', children }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                as={motion.div}
                className={cn('w-full glass-card p-6', SIZES[size])}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    {title ? (
                      <Dialog.Title className="text-lg font-semibold text-ink">{title}</Dialog.Title>
                    ) : null}
                    {description ? (
                      <Dialog.Description className="mt-1 text-sm text-muted">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-ink"
                  >
                    <IoClose className="h-5 w-5" />
                  </button>
                </div>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
