import axios from 'axios';

interface ApiErrorResponse {
  error?: {
    type?: string;
    message?: string;
  };
}

const GENERIC_ERROR_MESSAGE = 'Algo deu errado, tente novamente';

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error) || !error.response) return GENERIC_ERROR_MESSAGE;

  const { status, data } = error.response;
  if (status === 429 || status >= 500) return GENERIC_ERROR_MESSAGE;

  return data?.error?.message ?? GENERIC_ERROR_MESSAGE;
}
