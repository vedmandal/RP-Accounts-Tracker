import { CUSTOMER } from './actionTypes';

export const initialCustomerState = { options: [], version: 0 };

const customerReducer = (state, action) => {
  switch (action.type) {
    case CUSTOMER.SET_OPTIONS:
      return { ...state, options: action.payload };
    case CUSTOMER.INVALIDATE:
      return { ...state, version: state.version + 1 };
    case CUSTOMER.CLEAR:
      return initialCustomerState;
    default:
      return state;
  }
};

export default customerReducer;
