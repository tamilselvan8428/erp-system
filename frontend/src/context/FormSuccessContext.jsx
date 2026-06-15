import React, { createContext, useState, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FormSuccessEffect } from '../components/FormSuccessEffect.jsx';

const FormSuccessContext = createContext();

export const FormSuccessProvider = ({ children }) => {
  const [state, setState] = useState({
    isOpen: false,
    message: '',
    title: 'Submission Successful!',
  });

  const showSuccess = (message, title = 'Submission Successful!') => {
    setState({
      isOpen: true,
      message,
      title,
    });
  };

  const closeSuccess = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <FormSuccessContext.Provider value={{ showSuccess }}>
      {children}
      <AnimatePresence>
        {state.isOpen && (
          <FormSuccessEffect
            message={state.message}
            title={state.title}
            onClose={closeSuccess}
          />
        )}
      </AnimatePresence>
    </FormSuccessContext.Provider>
  );
};

export const useFormSuccess = () => {
  const context = useContext(FormSuccessContext);
  if (!context) {
    throw new Error('useFormSuccess must be used within a FormSuccessProvider');
  }
  return context;
};
