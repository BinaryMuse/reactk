interface GtkWidget {
  add: (child: GtkWidget) => void;
  remove: (child: GtkWidget) => void;

  connect: (signal: string, callback: Function) => number;
  disconnect: (number) => void;

  setLabel: (string) => void;
  showAll: () => void;
}

type Constructor = { new (...args: any[]): any };

type Props = {
  [key: string]: any;
};

type UpdatePayload = {
  signalSet: SignalSet;
  propertyUpdates: {
    [key: string]: any;
  };
};

type SignalSet = {
  [signal: string]: Function;
};

interface Signal {
  callback: Function;
  handle: number;
}

export interface Container {
  createGtkWidget: (type: string, props: Props) => GtkWidget;
  stopGtk: () => void;
}

interface HostContext {
  openWindows: number;
}

export const DEFAULT_HOST_CONTEXT = { openWindows: 0 };

function isSignal(signal: string) {
  return signal.startsWith("on-");
}

// "onClicked" => "on-clicked"
function dasherize(str: string) {
  const regex = /[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g;
  return str.replace(regex, (s, i) => {
    return (i > 0 ? "-" : "") + s.toLowerCase();
  });
}

// "on-clicked" => "onClicked"
function camelcase(str: string) {
  return str
    .split("-")
    .map(capitalize)
    .join("");
}

function capitalize(str: string) {
  return str[0].toUpperCase() + str.substr(1);
}

function formatPropsForGtk(props: Props): Props {
  const newProps: Props = Object.keys(props).reduce((acc, key) => {
    const newKey = dasherize(key);
    acc[newKey] = props[key];
    return acc;
  }, {});

  delete newProps.children;
  return newProps;
}

function collectSignals(
  props: Props
): { normalProps: Props; signals: SignalSet } {
  const normalProps = {};
  const signals = {};

  for (const key of Object.keys(props)) {
    if (isSignal(key)) {
      const newKey = key.substr(3); // e.g. strip "on-" from "on-clicked"
      signals[newKey] = props[key];
    } else {
      normalProps[key] = props[key];
    }
  }

  return { normalProps, signals };
}

export class WidgetWrapper {
  protected props: Props;
  private type: string;
  private signals: Map<string, Signal> = new Map();
  private gtkWidget: GtkWidget;

  public static readonly type: string = "<ROOT>";

  // Called by our reconciler
  public static shouldSetTextContent(props: Props): boolean {
    return false;
  }

  public static forType(type: string): typeof WidgetWrapper {
    switch (type) {
      case "window":
        return Window;
      case "button":
        return Button;
      default:
        throw new Error(`Unknown widget type: ${type}`);
    }
  }

  constructor(
    type: string,
    props: Props,
    container: Container,
    hostContext: HostContext
  ) {
    this.props = props;
    const fixedProps = formatPropsForGtk(props);
    const { normalProps, signals } = collectSignals(fixedProps);

    const constructor = WidgetWrapper.forType(type);
    this.gtkWidget = container.createGtkWidget(constructor.type, normalProps);
    this.setSignals(signals);
  }

  public getGtkWidget(): GtkWidget {
    return this.gtkWidget;
  }

  // Called by our reconciler
  public add(child: WidgetWrapper) {
    this.gtkWidget.add(child.getGtkWidget());
  }

  // Called by our reconciler
  public remove(child: WidgetWrapper) {
    this.gtkWidget.remove(child.getGtkWidget());
  }

  // Called by our reconciler
  public finalizeInitialChildren(
    props: Props,
    container: Container,
    hostContext: Props
  ) {
    // no-op
  }

  // Called by our reconciler
  public prepareUpdate(
    type: string,
    oldProps: Props,
    newProps: Props,
    hostContext: HostContext
  ): UpdatePayload {
    const updatePayload = {
      signalSet: {},
      propertyUpdates: {}
    };

    const fixedOldProps = formatPropsForGtk(oldProps);
    const fixedNewProps = formatPropsForGtk(newProps);
    const { normalProps: oldNormalProps } = collectSignals(fixedOldProps);
    const { normalProps: newNormalProps, signals } = collectSignals(
      fixedNewProps
    );

    // All signals that should be present on the Widget should be
    // returned, not only new and changed ones. Widget only re-assigns
    // a signal if the callback has actually changed.
    updatePayload.signalSet = signals;

    for (const key of Object.keys(newNormalProps)) {
      if (newNormalProps[key] !== oldNormalProps[key]) {
        const camelCased = camelcase(key);
        const update = `set${camelCased}`;
        updatePayload.propertyUpdates[update] = newNormalProps[key];
      }
    }

    return updatePayload;
  }

  // Called by our reconciler
  public commitUpdate(
    type: string,
    updatePayload: UpdatePayload,
    oldProps: Props,
    newProps: Props
  ) {
    this.props = newProps;
    this.applyPropertyUpdates(updatePayload);
  }

  protected applyPropertyUpdates(updatePayload: Props) {
    this.setSignals(updatePayload.signalSet);
    for (const update of Object.keys(updatePayload.propertyUpdates)) {
      const widget = this.getGtkWidget() as any;
      widget[update](updatePayload.propertyUpdates[update]);
    }
  }

  protected setSignals(signals: SignalSet) {
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

  protected attachSignal(signal: string, callback: Function) {
    // Only one connection per signal per widget allowed
    if (this.signals.has(signal)) {
      const sig = this.signals.get(signal)!;
      if (sig.callback === callback) {
        return;
      }
      this.detachSignal(signal);
    }

    try {
      const handle = this.gtkWidget.connect(signal, callback);
      this.signals.set(signal, { handle, callback });
    } catch {
      throw new Error(
        `Could not attach signal '${signal}' to widget of type '${this.type}'`
      );
    }
  }

  protected detachSignal(signal) {
    const sig = this.signals.get(signal);
    if (sig) {
      this.signals.delete(signal);
      this.gtkWidget.disconnect(sig.handle);
    }
  }
}

export class Window extends WidgetWrapper {
  public static readonly type: string = "Window";

  public finalizeInitialChildren(
    props: Props,
    container: Container,
    hostContext: HostContext
  ) {
    const win = this.getGtkWidget();
    win.showAll();
    hostContext.openWindows++;
    win.connect("destroy", () => {
      hostContext.openWindows--;
      if (hostContext.openWindows <= 0) {
        container.stopGtk();
      }
    });
  }
}

export class Button extends WidgetWrapper {
  public static readonly type: string = "Button";

  // The Button widget should set text content itself (e.g. here with
  // `setLabel`) instead of defaulting to React's parent/child component
  // relationship.
  public static shouldSetTextContent(props: Props): boolean {
    return true;
  }

  public finalizeInitialChildren(
    props: Props,
    container: Container,
    hostContext: HostContext
  ) {
    if (props.children && typeof props.children === "string") {
      this.setLabel(props.children);
    }
  }

  public prepareUpdate(
    type: string,
    oldProps: Props,
    newProps: Props,
    hostContext: HostContext
  ): UpdatePayload {
    const payload = super.prepareUpdate(type, oldProps, newProps, hostContext);

    if (oldProps.children !== newProps.children) {
      payload.propertyUpdates.setLabel = newProps.children || "";
    }

    return payload;
  }

  protected setLabel(label: string) {
    this.getGtkWidget().setLabel(label);
  }
}
