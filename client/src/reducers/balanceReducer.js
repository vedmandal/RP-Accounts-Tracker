import { BALANCE } from './actionTypes';

export const initialBalanceState = { balances: null, history: [], loading: false, error: null, version: 0 };

const balanceReducer = (state, action) => {
  switch (action.type) {
    case BALANCE.REQUEST:
      return { ...state, loading: true, error: null };
    case BALANCE.SUCCESS:
      return { ...state, loading: false, balances: action.payload };
    case BALANCE.FAILURE:
      return { ...state, loading: false, error: action.payload };
    case BALANCE.SET_HISTORY:
      return { ...state, history: action.payload };
    case BALANCE.INVALIDATE:
      return { ...state, version: state.version + 1 };
    default:
      return state;
  }
};

export default balanceReducer;
