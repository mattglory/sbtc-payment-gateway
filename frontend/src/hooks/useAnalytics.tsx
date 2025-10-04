import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

interface AnalyticsContextType {
  events: AnalyticsEvent[];
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name: string, properties?: Record<string, any>) => void;
  clearEvents: () => void;
  getEventCount: (event: string) => number;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Load saved events from localStorage
    const savedEvents = localStorage.getItem('analytics_events');
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
        setEvents(parsedEvents);
      } catch (error) {
        console.error('Error loading analytics events:', error);
      }
    }

    // Auto-track page load
    track('page_load', {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });
  }, []);

  useEffect(() => {
    // Save events to localStorage whenever events change
    localStorage.setItem('analytics_events', JSON.stringify(events));
  }, [events]);

  const track = (event: string, properties?: Record<string, any>) => {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        userId,
        sessionId: getSessionId(),
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    setEvents(prev => [...prev, analyticsEvent]);

    // In production, this would send to analytics service
    console.log('Analytics Event:', analyticsEvent);

    // Simulate sending to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics, Mixpanel, etc.
      // gtag('event', event, properties);
      // mixpanel.track(event, properties);
    }
  };

  const identify = (newUserId: string, traits?: Record<string, any>) => {
    setUserId(newUserId);
    track('user_identified', {
      userId: newUserId,
      traits
    });
  };

  const page = (name: string, properties?: Record<string, any>) => {
    track('page_view', {
      page: name,
      ...properties
    });
  };

  const clearEvents = () => {
    setEvents([]);
    localStorage.removeItem('analytics_events');
  };

  const getEventCount = (event: string) => {
    return events.filter(e => e.event === event).length;
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  };

  const value: AnalyticsContextType = {
    events,
    track,
    identify,
    page,
    clearEvents,
    getEventCount
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};