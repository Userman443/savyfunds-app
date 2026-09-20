/**
 * Twitter Conversion Tracking Utilities
 * Handles Twitter pixel initialization and event tracking
 */

declare global {
  interface Window {
    twq: (...args: any[]) => void;
  }
}

interface TwitterEventContent {
  content_type?: string | null;
  content_id?: string | null;
  content_name?: string | null;
  content_price?: string | null;
  num_items?: number | null;
  content_group_id?: string | null;
}

interface TwitterEventParams {
  contents?: TwitterEventContent[];
  status?: string | null;
  conversion_id?: string | null;
  email_address?: string | null;
  value?: string;
  currency?: string;
}

/**
 * Initialize Twitter tracking pixel - now loaded via HTML head
 */
export const initTwitterTracking = (pixelId: string = 'pyrld'): void => {
  if (typeof window === 'undefined') return;

  // Twitter pixel is now loaded via HTML head, just verify it's working
  if (window.twq) {
    console.log('Twitter tracking initialized with pixel ID:', pixelId);
    window.twq('track', 'PageView');
  } else {
    console.warn('Twitter tracking script not loaded properly');
  }
};

/**
 * Track Twitter conversion events
 */
export const trackTwitterEvent = (eventId: string, params?: TwitterEventParams): void => {
  if (typeof window === 'undefined' || !window.twq) {
    console.warn('Twitter tracking not initialized');
    return;
  }

  try {
    window.twq('event', eventId, params);
  } catch (error) {
    console.error('Twitter tracking error:', error);
  }
};

/**
 * Track user registration conversion
 */
export const trackRegistration = (userEmail?: string, userId?: string): void => {
  trackTwitterEvent('tw-pyrld-pzsep', {
    contents: [{
      content_type: 'user_registration',
      content_id: userId || null,
      content_name: 'User Registration',
      content_price: null,
      num_items: 1,
      content_group_id: 'registration'
    }],
    status: 'completed',
    conversion_id: userId || `reg_${Date.now()}`,
    email_address: userEmail || null
  });
};

/**
 * Track financial goal creation
 */
export const trackGoalCreation = (goalData: {
  id?: string;
  title?: string;
  targetAmount?: number;
  userEmail?: string;
}): void => {
  trackTwitterEvent('tw-pyrld-pzsep', {
    contents: [{
      content_type: 'financial_goal',
      content_id: goalData.id || null,
      content_name: goalData.title || 'Financial Goal',
      content_price: goalData.targetAmount?.toString() || null,
      num_items: 1,
      content_group_id: 'goals'
    }],
    status: 'created',
    conversion_id: goalData.id || `goal_${Date.now()}`,
    email_address: goalData.userEmail || null
  });
};

/**
 * Track learning module completion
 */
export const trackModuleCompletion = (moduleData: {
  id?: string;
  title?: string;
  userEmail?: string;
  userId?: string;
}): void => {
  trackTwitterEvent('tw-pyrld-pzsep', {
    contents: [{
      content_type: 'learning_module',
      content_id: moduleData.id || null,
      content_name: moduleData.title || 'Learning Module',
      content_price: null,
      num_items: 1,
      content_group_id: 'education'
    }],
    status: 'completed',
    conversion_id: `module_${moduleData.id}_${moduleData.userId}` || `module_${Date.now()}`,
    email_address: moduleData.userEmail || null
  });
};

/**
 * Track AI assistant interaction
 */
export const trackAIInteraction = (userEmail?: string, userId?: string): void => {
  trackTwitterEvent('tw-pyrld-pzsep', {
    contents: [{
      content_type: 'ai_interaction',
      content_id: 'ai_assistant',
      content_name: 'AI Assistant Interaction',
      content_price: null,
      num_items: 1,
      content_group_id: 'engagement'
    }],
    status: 'engaged',
    conversion_id: `ai_${userId}_${Date.now()}` || `ai_${Date.now()}`,
    email_address: userEmail || null
  });
};

/**
 * Track premium feature access (future use)
 */
export const trackPremiumAccess = (featureName: string, userEmail?: string, userId?: string, price?: number): void => {
  trackTwitterEvent('tw-pyrld-pzsep', {
    contents: [{
      content_type: 'premium_feature',
      content_id: featureName,
      content_name: `Premium: ${featureName}`,
      content_price: price?.toString() || null,
      num_items: 1,
      content_group_id: 'premium'
    }],
    status: 'purchased',
    conversion_id: `premium_${userId}_${Date.now()}` || `premium_${Date.now()}`,
    email_address: userEmail || null,
    value: price?.toString(),
    currency: 'USD'
  });
};

/**
 * Track page views with custom data
 */
export const trackPageView = (pageName: string, userEmail?: string): void => {
  if (typeof window === 'undefined' || !window.twq) return;
  
  window.twq('track', 'PageView');
  
  // Track specific page engagement
  trackTwitterEvent('tw-pyrld-pzsep', {
    contents: [{
      content_type: 'page_view',
      content_id: pageName,
      content_name: `Page: ${pageName}`,
      content_price: null,
      num_items: 1,
      content_group_id: 'engagement'
    }],
    status: 'viewed',
    conversion_id: `page_${pageName}_${Date.now()}`,
    email_address: userEmail || null
  });
};

/**
 * Track main conversion event using the primary Twitter event ID
 * This is the consolidated conversion tracking for campaign optimization
 */
export const trackMainConversion = (eventData: {
  action: 'signup' | 'login' | 'goal_created' | 'ai_interaction' | 'page_view' | 'conversion';
  userId?: string;
  email?: string;
  value?: string;
  content?: string;
}): void => {
  trackTwitterEvent('tw-pyrld-pyrld', {
    contents: [{
      content_type: eventData.action,
      content_id: eventData.userId || 'anonymous',
      content_name: eventData.content || eventData.action,
      content_price: eventData.value || null,
      num_items: 1,
      content_group_id: 'savyfunds_conversion'
    }],
    status: 'completed',
    conversion_id: `${eventData.action}_${eventData.userId || 'anon'}_${Date.now()}`,
    email_address: eventData.email || null
  });
};