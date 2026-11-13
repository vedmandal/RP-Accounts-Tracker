import { BalanceContext } from './contexts';
import { useCallback, useMemo, useReducer } from 'react';
import balanceReducer, { initialBalanceState } from '../reducers/balanceReducer';
import { BALANCE } from '../reducers/actionTypes';
import * as balanceService from '../services/balanceService';
import { getErrorMessage } from '../services/api';
import { useToast } from '../hooks/useContexts';
import { useDashboard } from '../hooks/useContexts';


export const BalanceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(balanceReducer, initialBalanceState);
  const { notify } = useToast();
  const dashboard = useDashboard();

  const invalidate = useCallback(() => dispatch({ type: BALANCE.INVALIDATE }), []);

  const load = useCallback(async () => {
    dispatch({ type: BALANCE.REQUEST });
    try {
      const [balances, history] = await Promise.all([balanceService.getBalances(), balanceService.getBalanceHistory()]);
      dispatch({ type: BALANCE.SUCCESS, payload: balances.data });
      dispatch({ type: BALANCE.SET_HISTORY, payload: history.data });
    } catch (err) {
      dispatch({ type: BALANCE.FAILURE, payload: getErrorMessage(err) });
    }
  }, []);

  const setOpening = useCallback(
    async (payload) => {
      await balanceService.setOpeningBalance(payload);
      notify('Opening balance saved');
      invalidate();
      dashboard.invalidate();
    },
    [notify, invalidate, dashboard]
  );

  const transfer = useCallback(
    async (payload) => {
      await balanceService.createTransfer(payload);
      notify('Transfer recorded');
      invalidate();
      dashboard.invalidate();
    },
    [notify, invalidate, dashboard]
  );

  const value = useMemo(() => ({ ...state, load, setOpening, transfer, invalidate }), [state, load, setOpening, transfer, invalidate]);
  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
};
