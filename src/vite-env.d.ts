/// <reference types="vite/client" />

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(options: {
            client_id: string;
            callback: (response: unknown) => void;
            cancel_on_tap_outside?: boolean;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ): void;
          prompt(): void;
        };
      };
    };
  }
}

export { };
