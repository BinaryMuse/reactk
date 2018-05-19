import { Signal, SignalSet, Props } from "./utils";
import { GtkWidget } from "./gtk-utils";

export default class SignalManager {
  private widget: GtkWidget;
  private widgetType: string;
  private signals: Map<string, Signal> = new Map();

  // Buckets props (with dasherized keys) into regular props and signals.
  // Signals aren't passed to the GTK widget constructors, but are
  // attached to the widgets separately.
  public static collectSignals(
    dasherizedProps: Props
  ): { normalProps: Props; signals: SignalSet } {
    const normalProps = {};
    const signals = {};

    for (const key of Object.keys(dasherizedProps)) {
      if (key.startsWith("on-")) {
        // "on-clicked" => "clicked"
        let newKey = key.substr(3);
        if (key.startsWith("on-notify-")) {
          // "on-notify-prop-name" => "notify::prop-name"
          newKey = `notify::${key.substr(10)}`;
        }
        signals[newKey] = dasherizedProps[key];
      } else {
        normalProps[key] = dasherizedProps[key];
      }
    }

    return { normalProps, signals };
  }

  constructor(widget: GtkWidget, type: string) {
    this.widget = widget;
    this.widgetType = type;
  }

  public set(signals: SignalSet): void {
    // Remove any existing signals that aren't in the new set
    const currentSignals = [...this.signals.keys()];
    currentSignals.forEach(signal => {
      if (!signals[signal]) {
        this.detachSignal(signal);
      }
    });

    for (const signal of Object.keys(signals)) {
      // Automatically overwrites existing signals
      this.attachSignal(signal, signals[signal]);
    }
  }

  public attachSignal(signal: string, callback: Function): void {
    // Only one connection per signal per widget allowed
    if (this.signals.has(signal)) {
      const sig = this.signals.get(signal)!;
      if (sig.callback === callback) {
        return;
      }
      this.detachSignal(signal);
    }

    try {
      const handle = this.widget.connect(signal, callback);
      this.signals.set(signal, { handle, callback });
    } catch {
      throw new Error(
        `Could not attach signal '${signal}' to widget of type '${
          this.widgetType
        }'`
      );
    }
  }

  public detachSignal(signal): void {
    const sig = this.signals.get(signal);
    if (sig) {
      this.signals.delete(signal);
      this.widget.disconnect(sig.handle);
    }
  }
}
