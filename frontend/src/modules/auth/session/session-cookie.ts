export const SESSION_COOKIE = 'flash-chat.session';

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setSessionCookie() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; SameSite=Strict${secure}`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
}
