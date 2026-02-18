
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider");
  return context;
};

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((res) => {
      setResolveCallback(() => res);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveCallback?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveCallback?.(false);
  };

  const isRtl = document.documentElement.dir === 'rtl';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-emerald-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[320px] rounded-[2rem] shadow-2xl border border-emerald-50 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${options.variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-black text-emerald-950 mb-2 px-2">
                {options.title || (isRtl ? 'تأكيد الإجراء' : 'Confirm')}
              </h3>
              <p className="text-xs font-bold text-emerald-600/80 leading-relaxed mb-6 px-4">
                {options.message}
              </p>

              <div className="space-y-2">
                <button
                  onClick={handleConfirm}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all active:scale-95 shadow-sm ${
                    options.variant === 'danger' 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-emerald-900 text-white hover:bg-emerald-800'
                  }`}
                >
                  {options.confirmText || (isRtl ? 'تأكيد' : 'Confirm')}
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-3 bg-white text-emerald-900 rounded-xl font-black text-sm hover:bg-emerald-50 transition-all border border-emerald-100"
                >
                  {options.cancelText || (isRtl ? 'إلغاء' : 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
