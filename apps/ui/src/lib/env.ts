export const APP_URL = import.meta.env.DEV
	? `${import.meta.env.VITE_APP_URL}/api`
	: import.meta.env.VITE_API;
export const API_URL = import.meta.env.VITE_API;
