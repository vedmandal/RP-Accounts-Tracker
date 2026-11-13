import { DashboardContext } from './contexts';
import { useCallback, useMemo, useReducer } from 'react';
import dashboardReducer, { initialDashboardState } from '../reducers/dashboardReducer';
import { DASHBOARD } from '../reducers/actionTypes';
import * as dashboardService from '../services/dashboardService';
import { getErrorMessage } from '../services/api';


export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);

  const refresh = useCallback(async () => {
    dispatch({ type: DASHBOARD.REQUEST });
    try {
      const [summary, recent] = await Promise.all([dashboardService.getSummary(), dashboardService.getRecent(5)]);
      dispatch({ type: DASHBOARD.SUCCESS, payload: { summary: summary.data, recent: recent.data } });
    } catch (err) {
      dispatch({ type: DASHBOARD.FAILURE, payload: getErrorMessage(err) });
    }
  }, []);

  // Other contexts call this after money changes. The Dashboard page refetches when it is open,
  // so nothing is fetched needlessly while the user is on another page.
  const invalidate = useCallback(() => dispatch({ type: DASHBOARD.INVALIDATE }), []);

  const value = useMemo(() => ({ ...state, refresh, invalidate }), [state, refresh, invalidate]);
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
