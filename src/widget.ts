import { GtkWidget, formatPropsForGtk } from "./gtk-utils";
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
import SignalManager from "./signal-manager";

type WidgetRegistry = {
  [key: string]: typeof WidgetWrapper;
};

export class WidgetWrapper {
  private signals: Map<string, Signal> = new Map();
  private gtkWidget: GtkWidget;
  protected signalManager: SignalManager;

  public static readonly type: string = "<ROOT>";

  // Called by our reconciler
  public static shouldSetTextContent(props: Props): boolean {
    return false;
  }

  public static forType(type: string): typeof WidgetWrapper {
    // Require at run-time to avoid circular dependency issues
    const types: WidgetRegistry = require("./widgets").default;
    const widgetType = types[type];
    if (!widgetType) {
      throw new Error(`Unknown widget type: ${type}`);
    }
    return widgetType;
  }

  constructor(
    type: string,
    props: Props,
    container: Container,
    hostContext: HostContext
  ) {
    const fixedProps = formatPropsForGtk(props);
    const { normalProps, signals } = SignalManager.collectSignals(fixedProps);

    const constructor = WidgetWrapper.forType(type);
    this.gtkWidget = container.createGtkWidget(constructor.type, normalProps);
    this.signalManager = new SignalManager(this.gtkWidget, type);
    this.signalManager.set(signals);
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
    const { normalProps: oldNormalProps } = SignalManager.collectSignals(
      fixedOldProps
    );
    const {
      normalProps: newNormalProps,
      signals
    } = SignalManager.collectSignals(fixedNewProps);

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
    this.signalManager.set(updatePayload.signalSet);
    for (const update of Object.keys(updatePayload.propertyUpdates)) {
      const widget = this.getGtkWidget() as any;
      widget[update](updatePayload.propertyUpdates[update]);
    }
  }
}
