import axiosInstance from './axios';

export const createApi = (getToken) => {
    const request = async (method, url, data, config = {}) => {
        const token = await getToken();

        const headers = {
            ...config.headers,
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return axiosInstance({
            method,
            url,
            data,
            ...config,
            headers,
        });
    };

    return {
        get: (url, config) =>
            request('GET', url, undefined, config),

        post: (url, data, config) =>
            request('POST', url, data, config),
    };
};