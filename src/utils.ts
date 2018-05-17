import { GtkWidget } from "./gtk-utils";

export type Constructor = { new (...args: any[]): any };

export type Props = {
  [key: string]: any;
};

export type UpdatePayload = {
  signalSet: SignalSet;
  propertyUpdates: {
    [key: string]: any;
  };
};

export type SignalSet = {
  [signal: string]: Function;
};

export interface Signal {
  callback: Function;
  handle: number;
}

export interface Container {
  startGtk: () => void;
  createGtkWidget: (type: string, props: Props) => GtkWidget;
  stopGtk: () => void;
}

export interface HostContext {
  openWindows: number;
}

export function getDefaultHostContext(): HostContext {
  return { openWindows: 0 };
}

// "on-clicked" => "onClicked"
export function camelcase(str: string) {
  return str
    .split("-")
    .map(capitalize)
    .join("");
}

// "onClicked" => "on-clicked"
export function dasherize(str: string) {
  const regex = /[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g;
  return str.replace(regex, (s, i) => {
    return (i > 0 ? "-" : "") + s.toLowerCase();
  });
}

export function capitalize(str: string) {
  return str[0].toUpperCase() + str.substr(1);
}
