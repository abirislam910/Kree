// Typed builders for axios responses and errors, so tests can stub axios.post
// while the code under test still narrows errors with axios.isAxiosError.

import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

function requestConfig (): InternalAxiosRequestConfig {
    return { headers: new AxiosHeaders() };
}

export function axiosResponse (data: unknown, status = 200): AxiosResponse<unknown> {
    return { data, status, statusText: String(status), headers: {}, config: requestConfig() };
}

export function httpError (status: number, headers: Record<string, string> = {}): AxiosError {
    const response: AxiosResponse<unknown> = { ...axiosResponse({}, status), headers };
    return new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', requestConfig(), {}, response);
}

export function networkError (): AxiosError {
    return new AxiosError('socket hang up', 'ECONNRESET', requestConfig(), {});
}
