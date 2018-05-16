declare namespace JSX {
  interface IntrinsicElements {
    window: any;
    button: any;
  }
}

declare module "node-gir" {
  export const Gtk: any;
}

declare module "react-reconciler" {
  type ReactContainer<T> = any;

  // There's actually much more than this
  interface Reconciler {
    createContainer<T>(
      containerInfo: T,
      isAsync: boolean,
      hydrate: boolean
    ): ReactContainer<T>;
    updateContainer<T>(
      element: JSX.Element,
      container: ReactContainer<T>,
      parentComponent?: React.Component,
      callback?: (...any) => void
    ): any;
    getPublicRootInstance<T>(container: ReactContainer<T>): any;
  }

  type HostConfig = any;

  const ReactReconciler: (hostConfig: HostConfig) => Reconciler;

  export = ReactReconciler;
}
