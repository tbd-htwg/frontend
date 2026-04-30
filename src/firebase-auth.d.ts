export {}

declare global {
  interface Window {
    firebase?: {
      apps?: Array<unknown>
      initializeApp: (config: { apiKey: string; authDomain: string }) => unknown
      auth: ((() => {
        signInWithPopup: (provider: unknown) => Promise<{
          user: {
            getIdToken: () => Promise<string>
          } | null
        }>
      })) & {
        GoogleAuthProvider: new () => unknown
      }
    }
  }
}
