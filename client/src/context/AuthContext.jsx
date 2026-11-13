import { AuthContext } from './contexts';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import authReducer, { initialAuthState } from '../reducers/authReducer';
import { AUTH } from '../reducers/actionTypes';
import * as authService from '../services/authService';


export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const logout = useCallback(() => {
    localStorage.removeItem('rp_token');
    dispatch({ type: AUTH.LOGOUT });
  }, []);

  // Restore the session on page load.
  useEffect(() => {
    if (!localStorage.getItem('rp_token')) {
      dispatch({ type: AUTH.INIT_DONE });
      return;
    }
    authService
      .getMe()
      .then(({ data }) => dispatch({ type: AUTH.SET_USER, payload: data }))
      .catch(() => logout());
  }, [logout]);

  // The Axios interceptor fires this when the server says the token is invalid.
  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login(email, password);
    localStorage.setItem('rp_token', data.token);
    dispatch({ type: AUTH.SET_USER, payload: data.user });
  }, []);

  const registerFirstAdmin = useCallback(async (payload) => {
    const { data } = await authService.register(payload);
    localStorage.setItem('rp_token', data.token);
    dispatch({ type: AUTH.SET_USER, payload: data.user });
  }, []);

  const value = useMemo(() => ({ ...state, login, registerFirstAdmin, logout }), [state, login, registerFirstAdmin, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
