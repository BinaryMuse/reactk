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

// Turns React style props to options that can be passed
// to GTK widget constructors. Dasherizes all props and
// removes `children`.
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
  dasherizedProps: Props
): { normalProps: Props; signals: SignalSet } {
  const normalProps = {};
  const signals = {};

  for (const key of Object.keys(dasherizedProps)) {
    if (isSignal(key)) {
      const newKey = key.substr(3); // e.g. strip "on-" from "on-clicked"
      signals[newKey] = dasherizedProps[key];
    } else {
      normalProps[key] = dasherizedProps[key];
    }
  }

  return { normalProps, signals };
}

export class WidgetWrapper {
  protected container: Container;
  private signals: Map<string, Signal> = new Map();
  private pendingChildren: Array<WidgetWrapper> = [];
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
    this.container = container;
  }

  public getGtkWidget(): GtkWidget {
    if (!this.gtkWidget) {
      throw new Error("Cannot get GTK widget as it has not yet been created.");
    }

    return this.gtkWidget;
  }

  private createGtkWidget(type: string, props: Props): void {
    if (this.gtkWidget) {
      throw new Error("GTK widget is already created.");
    }

    const fixedProps = formatPropsForGtk(props);
    const { normalProps, signals } = collectSignals(fixedProps);

    const constructor = WidgetWrapper.forType(type);
    this.gtkWidget = this.container.createGtkWidget(
      constructor.type,
      normalProps
    );
    this.setSignals(signals);
  }

  // Called by our reconciler — render phase
  public appendInitialChild(child: WidgetWrapper): void {
    this.pendingChildren.push(child);
  }

  // Called by our reconciler — commit phase
  public add(child: WidgetWrapper): void {
    this.gtkWidget.add(child.getGtkWidget());
  }

  // Called by our reconciler — commit phase
  public remove(child: WidgetWrapper): void {
    this.gtkWidget.remove(child.getGtkWidget());
  }

  // Called by our reconciler — render phase
  public finalizeInitialChildren(
    type: string,
    props: Props,
    container: Container,
    hostContext: Props
  ): boolean {
    return true;
  }

  // Called by our reconciler — render phase
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

  // Called by our reconciler — commit phase
  public commitMount(type: string, props: Props): void {
    this.createGtkWidget(type, props);

    for (const child of this.pendingChildren) {
      this.add(child);
    }
    this.pendingChildren.length = 0;
  }

  // Called by our reconciler — commit phase
  public commitUpdate(
    type: string,
    updatePayload: UpdatePayload,
    oldProps: Props,
    newProps: Props
  ): void {
    this.applyPropertyUpdates(updatePayload);
  }

  protected applyPropertyUpdates(updatePayload: UpdatePayload): void {
    this.setSignals(updatePayload.signalSet);
    for (const update of Object.keys(updatePayload.propertyUpdates)) {
      const widget = this.getGtkWidget() as any;
      widget[update](updatePayload.propertyUpdates[update]);
    }
  }

  protected setSignals(signals: SignalSet): void {
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

  protected attachSignal(signal: string, callback: Function): void {
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
        `Could not attach signal '${signal}' to widget of type '${
          (this.constructor as typeof WidgetWrapper).type
        }'`
      );
    }
  }

  protected detachSignal(signal): void {
    const sig = this.signals.get(signal);
    if (sig) {
      this.signals.delete(signal);
      this.gtkWidget.disconnect(sig.handle);
    }
  }
}

export class Window extends WidgetWrapper {
  public static readonly type: string = "Window";
  // This used to live on the host context, but we need access to it
  // during the commit phase.
  private static numOpenWindows = 0;

  public commitMount(type: string, props: Props): void {
    super.commitMount(type, props);
    const win = this.getGtkWidget();
    const klass = this.constructor as typeof Window;

    win.connect("destroy", () => {
      klass.numOpenWindows--;
      if (klass.numOpenWindows <= 0) {
        this.container.stopGtk();
      }
    });
    klass.numOpenWindows++;
    win.showAll();
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

  public commitMount(type: string, props: Props): void {
    super.commitMount(type, props);

    if (
      props.children &&
      (typeof props.children === "string" || typeof props.children === "number")
    ) {
      this.getGtkWidget().setLabel(props.children);
    }
  }
}
