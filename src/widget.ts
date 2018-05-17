import { GtkWidget, formatPropsForGtk, collectSignals } from "./gtk-utils";
import {
  Constructor,
  Props,
  UpdatePayload,
  SignalSet,
  Signal,
  Container,
  HostContext,
  camelcase
} from "./utils";

export class WidgetWrapper {
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
      case "image":
        return Image;
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
    const fixedProps = formatPropsForGtk(props);
    const { normalProps, signals } = collectSignals(fixedProps);

    const constructor = WidgetWrapper.forType(type);
    this.gtkWidget = container.createGtkWidget(constructor.type, normalProps);
    this.setSignals(signals);
  }

  public getGtkWidget(): GtkWidget {
    return this.gtkWidget;
  }

  // Called by our reconciler — render phase
  public appendInitialChild(child: WidgetWrapper): void {
    this.add(child);
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
    return false;
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
    // called if finalizeInitialChildren returns true
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

  private static openWindows: number = 0;

  incrementOpenWindows(amount: number): number {
    const constr = this.constructor as typeof Window;
    constr.openWindows += amount;
    return constr.openWindows;
  }

  getOpenWindows(): number {
    return (this.constructor as typeof Window).openWindows;
  }

  public finalizeInitialChildren(
    type: string,
    props: Props,
    container: Container,
    hostContext: HostContext
  ): boolean {
    const win = this.getGtkWidget();

    win.connect("show", () => {
      this.incrementOpenWindows(1);
    });

    win.connect("hide", () => {
      this.incrementOpenWindows(-1);
    });

    win.connect("destroy", () => {
      if (this.getOpenWindows() <= 0) {
        container.stopGtk();
      }
    });

    return true;
  }

  public commitMount(type: string, props: Props): void {
    if (props.visible === void 0 || !!props.visible) {
      this.getGtkWidget().showAll();
    }
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

  public finalizeInitialChildren(
    type: string,
    props: Props,
    container: Container,
    hostContext: HostContext
  ): boolean {
    if (
      props.children &&
      (typeof props.children === "string" || typeof props.children === "number")
    ) {
      this.getGtkWidget().setLabel(props.children);
    }

    return false;
  }
}

export class Image extends WidgetWrapper {
  public static readonly type: string = "Image";
}
