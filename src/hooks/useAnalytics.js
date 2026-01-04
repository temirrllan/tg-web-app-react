import { useEffect, useCallback, useRef } from 'react';
import { analytics, EVENTS } from '../utils/analytics';

export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackFunnelStep: analytics.trackFunnelStep.bind(analytics),
    EVENTS,
  };
};

export const usePageView = (pageName, metadata = {}) => {
  const { track } = useAnalytics();
  
  useEffect(() => {
    track(EVENTS.NAVIGATION.PAGE_VIEW, {
      page: pageName,
      ...metadata,
    });
  }, [pageName, track]);
};

export const usePageSession = (pageName, metadata = {}) => {
  const metadataRef = useRef(metadata);
  
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);
  
  useEffect(() => {
    const endSession = analytics.trackPageSession(pageName, metadataRef.current);
    return () => {
      endSession();
    };
  }, [pageName]);
};

export const useErrorTracking = (componentName) => {
  const { trackError } = useAnalytics();
  
  return useCallback((error, additionalContext = {}) => {
    trackError(error, {
      component: componentName,
      ...additionalContext,
    });
  }, [trackError, componentName]);
};

export default useAnalytics;