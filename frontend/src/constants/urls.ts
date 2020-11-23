if (!process.env.REACT_APP_BASE_URL) {
    throw new Error("REACT_APP_BASE_URL must be provided");
}

export const BASE_URL = process.env.REACT_APP_BASE_URL;

export const API_URL = `${BASE_URL}/api`;

export const IMAGE_HOST = BASE_URL;
