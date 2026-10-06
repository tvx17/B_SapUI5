/** The isolated preload exposes this optional adapter to the renderer. */
export interface DesktopAPI {
  readonly platform: string;
}

declare global {
  interface Window {
    readonly desktop?: DesktopAPI;
  }
}
