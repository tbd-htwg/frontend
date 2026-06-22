/** Map Firebase Auth error codes to short user-facing messages. */
export function firebaseAuthErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : ''

  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/api-key-not-found.-please-pass-a-valid-api-key.':
      return 'Login is temporarily misconfigured: the deployed frontend has no valid Identity Platform API key.'
    default:
      return err instanceof Error ? err.message : 'Authentication failed.'
  }
}
