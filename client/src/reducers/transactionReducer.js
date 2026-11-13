import { TXN } from './actionTypes';

export const initialTransactionState = { categories: [], version: 0 };

const transactionReducer = (state, action) => {
  switch (action.type) {
    case TXN.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    case TXN.INVALIDATE:
      return { ...state, version: state.version + 1 };
    case TXN.CLEAR:
      return initialTransactionState;
    default:
      return state;
  }
};

export default transactionReducer;
