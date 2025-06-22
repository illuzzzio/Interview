'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { vapi } from './vapi.sdk';

interface InterviewContextType {
  isInterviewActive: boolean;
  setIsInterviewActive: (active: boolean) => void;
  stopInterview: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

export const InterviewProvider = ({ children }: { children: ReactNode }) => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);

  const stopInterview = () => {
    if (isInterviewActive) {
      vapi.stop();
      setIsInterviewActive(false);
    }
  };

  return (
    <InterviewContext.Provider value={{
      isInterviewActive,
      setIsInterviewActive,
      stopInterview
    }}>
      {children}
    </InterviewContext.Provider>
  );
}; 