/**
 * Firebase / API error codes -> Bangla. Wrong ID, wrong password, unknown and
 * disabled accounts all share one message so the form never reveals whether
 * a Student ID exists.
 */

export const MESSAGES = {
  invalidCredentials: "স্টুডেন্ট আইডি বা পাসওয়ার্ড সঠিক নয়।",
  invalidIdFormat: "স্টুডেন্ট আইডিটি সঠিকভাবে লেখো (যেমন: b26a-101)।",
  missingFields: "স্টুডেন্ট আইডি এবং পাসওয়ার্ড দুটোই লেখো।",
  tooManyRequests: "অনেকবার ভুল চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করো।",
  network: "ইন্টারনেট সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করো।",
  popupBlocked: "পপআপ ব্লক হয়ে গেছে। ব্রাউজারে পপআপ চালু করে আবার চেষ্টা করো।",
  popupClosed: "Google লগইন বাতিল করা হয়েছে।",
  googleNotLinked:
    "এই Google অ্যাকাউন্টটি কোনো শিক্ষার্থীর সাথে যুক্ত নয়। প্রথমে স্টুডেন্ট আইডি দিয়ে লগইন করে অ্যাকাউন্ট পাতা থেকে Google যুক্ত করো।",
  accountExistsDifferentCredential:
    "এই ইমেইলের অ্যাকাউন্টটি অন্যভাবে লগইন করে। স্টুডেন্ট আইডি দিয়ে লগইন করো।",
  credentialInUse:
    "এই Google অ্যাকাউন্টটি ইতিমধ্যে অন্য একজন ব্যবহারকারীর সাথে যুক্ত। দুটি অ্যাকাউন্ট একসাথে মেলানো হয় না — অন্য একটি Google অ্যাকাউন্ট ব্যবহার করো, অথবা শিক্ষকের সাথে যোগাযোগ করো।",
  providerAlreadyLinked: "তোমার অ্যাকাউন্টে ইতিমধ্যে একটি Google অ্যাকাউন্ট যুক্ত আছে।",
  googleLinked: "Google অ্যাকাউন্ট যুক্ত হয়েছে। এখন থেকে Google দিয়েও লগইন করতে পারবে।",
  passwordTooShort: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।",
  passwordTooLong: "পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে পারে।",
  passwordMismatch: "দুটি পাসওয়ার্ড মিলছে না।",
  reauthRequired: "নিরাপত্তার জন্য আবার লগইন করে পাসওয়ার্ড পরিবর্তন করো।",
  sessionExpired: "তোমার সেশন শেষ হয়ে গেছে। আবার লগইন করো।",
  generic: "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করো।",
} as const;

export type Message = (typeof MESSAGES)[keyof typeof MESSAGES];

const BY_CODE: Record<string, Message> = {
  // Firebase Auth (client SDK)
  "auth/invalid-credential": MESSAGES.invalidCredentials,
  "auth/invalid-login-credentials": MESSAGES.invalidCredentials,
  "auth/wrong-password": MESSAGES.invalidCredentials,
  "auth/user-not-found": MESSAGES.invalidCredentials,
  "auth/invalid-email": MESSAGES.invalidCredentials,
  "auth/user-disabled": MESSAGES.invalidCredentials,
  "auth/too-many-requests": MESSAGES.tooManyRequests,
  "auth/network-request-failed": MESSAGES.network,
  "auth/popup-blocked": MESSAGES.popupBlocked,
  "auth/popup-closed-by-user": MESSAGES.popupClosed,
  "auth/cancelled-popup-request": MESSAGES.popupClosed,
  "auth/user-cancelled": MESSAGES.popupClosed,
  "auth/account-exists-with-different-credential": MESSAGES.accountExistsDifferentCredential,
  "auth/credential-already-in-use": MESSAGES.credentialInUse,
  "auth/email-already-in-use": MESSAGES.credentialInUse,
  "auth/provider-already-linked": MESSAGES.providerAlreadyLinked,
  // Our API
  "password-too-short": MESSAGES.passwordTooShort,
  "password-too-long": MESSAGES.passwordTooLong,
  "password-mismatch": MESSAGES.passwordMismatch,
  "invalid-id-format": MESSAGES.invalidIdFormat,
  "google-not-linked": MESSAGES.googleNotLinked,
  "reauth-required": MESSAGES.reauthRequired,
  "stale-sign-in": MESSAGES.reauthRequired,
  unauthenticated: MESSAGES.sessionExpired,
};

export function messageForError(err: unknown): Message {
  const code = (err as { code?: unknown } | null)?.code;
  return (typeof code === "string" && BY_CODE[code]) || MESSAGES.generic;
}
