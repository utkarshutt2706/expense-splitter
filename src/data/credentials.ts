import {
    CURRENT_USER_ID,
    FRIEND_ABHAY_ID,
    FRIEND_ABHINAV_ID,
    FRIEND_DIVANSHU_ID,
    FRIEND_KHEM_ID,
} from './seed';

interface Credential {
    username: string;
    password: string;
    userId: string;
}

// Not real authentication — a hardcoded per-friend username/password list, shared
// only with the people in CREDENTIALS. Logging in is how the app knows which
// friend is using it; replace these placeholder passwords with real ones before
// sharing this deployment with anyone.
const CREDENTIALS: Credential[] = [
    { username: 'utkarsh', password: 'changeme-utkarsh', userId: CURRENT_USER_ID }, // NOSONAR
    { username: 'abhay', password: 'changeme-abhay', userId: FRIEND_ABHAY_ID }, // NOSONAR
    { username: 'divanshu', password: 'changeme-divanshu', userId: FRIEND_DIVANSHU_ID }, // NOSONAR
    { username: 'abhinav', password: 'changeme-abhinav', userId: FRIEND_ABHINAV_ID }, // NOSONAR
    { username: 'khem', password: 'changeme-khem', userId: FRIEND_KHEM_ID }, // NOSONAR
];

export function findUserIdForCredentials(username: string, password: string): string | undefined {
    const normalizedUsername = username.trim().toLowerCase();
    const match = CREDENTIALS.find(
        (credential) =>
            credential.username === normalizedUsername && credential.password === password,
    );
    return match?.userId;
}
