// No accounts, no passwords: just a cookie remembering which "person" row this
// browser picked a name for. There's no security boundary to protect, so the
// cookie is just the person's id — nothing to sign or verify.
export const IDENTITY_COOKIE = 'tt_identity';
export const IDENTITY_DAYS = 3650; // effectively permanent
