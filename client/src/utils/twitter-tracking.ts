// Twitter conversion tracking utilities
// This file provides helper functions to track conversion events throughout the app

/**
 * Track Twitter conversion events
 * @param eventName - The name of the event to track
 * @param parameters - Optional parameters for the event
 */
export const trackTwitterEvent = (eventName: string, parameters?: Record<string, any>) => {
  try {
    if (typeof window !== 'undefined' && window.twq) {
      console.log(`Twitter tracking event: ${eventName}`, parameters);
      window.twq('event', eventName, parameters || {});
    } else {
      console.warn('Twitter tracking not initialized');
    }
  } catch (error) {
    console.error('Error tracking Twitter event:', error);
  }
};

/**
 * Track user registration
 */
export const trackRegistration = () => {
  trackTwitterEvent('tw-pyrld-signup', {
    conversion_id: 'pyrld-signup'
  });
};

/**
 * Track user login
 */
export const trackLogin = () => {
  trackTwitterEvent('tw-pyrld-login', {
    conversion_id: 'pyrld-login'
  });
};

/**
 * Track goal creation
 */
export const trackGoalCreation = (goalType?: string, targetAmount?: number) => {
  trackTwitterEvent('tw-pyrld-goal-created', {
    conversion_id: 'pyrld-goal-created',
    goal_type: goalType,
    value: targetAmount
  });
};

/**
 * Track page views for key pages
 */
export const trackPageView = (pageName: string) => {
  trackTwitterEvent('tw-pyrld-page-view', {
    conversion_id: 'pyrld-page-view',
    page_name: pageName
  });
};

/**
 * Track engagement with financial tools
 */
export const trackToolUsage = (toolName: string) => {
  trackTwitterEvent('tw-pyrld-tool-usage', {
    conversion_id: 'pyrld-tool-usage',
    tool_name: toolName
  });
};

/**
 * Track AI assistant interactions
 */
export const trackAIInteraction = (questionType?: string) => {
  trackTwitterEvent('tw-pyrld-ai-interaction', {
    conversion_id: 'pyrld-ai-interaction',
    question_type: questionType
  });
};

/**
 * Initialize Twitter tracking with debug info
 */
export const initializeTwitterTracking = () => {
  try {
    if (typeof window !== 'undefined' && window.twq) {
      console.log('Twitter tracking initialized successfully');
      // Track initial page load
      trackPageView('app-loaded');
    } else {
      console.warn('Twitter tracking script not loaded');
    }
  } catch (error) {
    console.error('Error initializing Twitter tracking:', error);
  }
};