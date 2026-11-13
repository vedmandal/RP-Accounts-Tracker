import { AUTH } from './actionTypes';

export const initialAuthState = { user: null, initialized: false };

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH.SET_USER:
      return { user: action.payload, initialized: true };
    case AUTH.LOGOUT:
      return { user: null, initialized: true };
    case AUTH.INIT_DONE:
      return { ...state, initialized: true };
    default:
      return state;
  }
};

export default authReducer;
