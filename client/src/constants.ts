const apiPort = import.meta.env.REACT_APP_API_PORT || 8000;
const apiHost = import.meta.env.REACT_APP_API_HOST || "localhost";

export const API_URL = `http://${apiHost}:${apiPort}`;
