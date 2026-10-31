import { AsyncLocalStorage } from 'node:async_hooks';

type RequestContext = {
  reqId: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();
