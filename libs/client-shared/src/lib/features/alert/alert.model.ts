
export type AlertId = string;

/**
 * A message that is displayed to the user.
 * It is usually a feedback to an event of some kind.
 */
export interface Alert {
  /**
   * A unique id for this alert.
   * This ensures that a message is only displayed once,
   * even when the events that are triggering it overlap.
   */
  id: AlertId

  /**
   * The alert's type, influencing its appearance.
   */
  type: AlertType

  /**
   * The display text.
   */
  text: string

  /**
   * Whether the alert stays until manually closed by the user,
   * or automatically disappears after a fixed amount of time.
   */
  isPersistent?: boolean,
}

/**
 * The visual styles that a {@link Alert} can have.
 */
export enum AlertType {
  /**
   * An expected and/or successful result.
   */
  Success = 'success',

  /**
   * Something that is informative, but not the direct or expected result of what the user is currently doing.
   */
  Notice = 'notice',

  /**
   * Something that requires further attention, but is not a full failure.
   */
  Warning = 'warning',

  /**
   * An unexpected and/or failed result.
   */
  Error = 'error',
}
