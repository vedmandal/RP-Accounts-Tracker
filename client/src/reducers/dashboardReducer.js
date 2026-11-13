import { DASHBOARD } from './actionTypes';

export const initialDashboardState = { summary: null, recent: null, loading: false, error: null, version: 0 };

const dashboardReducer = (state, action) => {
  switch (action.type) {
    case DASHBOARD.REQUEST:
      return { ...state, loading: true, error: null };
    case DASHBOARD.SUCCESS:
      return { ...state, loading: false, summary: action.payload.summary, recent: action.payload.recent };
    case DASHBOARD.FAILURE:
      return { ...state, loading: false, error: action.payload };
    case DASHBOARD.INVALIDATE:
      return { ...state, version: state.version + 1 };
    default:
      return state;
  }
};

export default dashboardReducer;
