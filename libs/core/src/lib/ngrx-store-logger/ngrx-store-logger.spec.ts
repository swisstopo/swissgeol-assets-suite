import { ActionReducer } from '@ngrx/store';

import { storeLogger } from './ngrx-store-logger';

describe('storeLogger', () => {
  it('should log state and action', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
      /* noop */
    });
    const metaReducer = storeLogger<string>();
    const actionReducer: ActionReducer<string, any> = (state: string | undefined, action: any) => {
      return state || '';
    };

    metaReducer(actionReducer)('state', { type: 'test' });

    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
