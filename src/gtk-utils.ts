import { Props, SignalSet, dasherize } from "./utils";

// Generic, incomplete interface for native GTK widgets.
// Used to provide minimal type-checking of GTK widget interactions.
export interface GtkWidget {
  // child management
  add: (child: GtkWidget) => void;
  remove: (child: GtkWidget) => void;

  // signal management
  connect: (signal: string, callback: Function) => number;
  disconnect: (number) => void;

  // misc.
  setLabel: (string) => void;
  showAll: () => void;
}

// Turns React style props to options that can be passed
// to GTK widget constructors. Dasherizes all props and
// removes `children`.
export function formatPropsForGtk(props: Props): Props {
  const newProps: Props = Object.keys(props).reduce((acc, key) => {
    const newKey = dasherize(key);
    acc[newKey] = props[key];
    return acc;
  }, {});

  delete newProps.children;
  return newProps;
}
