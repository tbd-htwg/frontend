export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          cancel: () => void
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string; select_by?: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              type?: 'standard' | 'icon'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              width?: string | number
            },
          ) => void
        }
      }
    }
  }
}
