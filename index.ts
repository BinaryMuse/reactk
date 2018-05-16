import * as React from "react";
import { ReactElement } from "react";
import { GtkBindings } from "node-gir";

import GtkReconciler from "./src/reconciler";

class GtkApi {
  private gtkBindings: GtkBindings;

  constructor(gtkBindings) {
    this.gtkBindings = gtkBindings;
  }

  startGtk() {
    this.gtkBindings.main();
  }

  createGtkWidget(type, props) {
    const constructor = this.gtkBindings[type]; // e.g. gtk.Window
    return new constructor(props);
  }

  stopGtk() {
    this.gtkBindings.mainQuit();
  }
}

const ReacTK = {
  render(element: JSX.Element, gtkBindings: GtkBindings, callback: () => void) {
    // Your renderer's container info is any information that the Reconciler
    // will need to do it's job during React's lifetime. Here we're using a
    // reference to a GTK+3 API, but you might have a handle to a native class
    // or a reference to some drawing context.
    //
    // React will make this object available to the Reconciler during certain
    // lifecycle hooks.
    const containerInfo = new GtkApi(gtkBindings);

    // There's no way the React bindings created for a host environment can have
    // access to dynamic, non-global resources until runtime; so, we pass React
    // our container info, and it gives us back a fiber root, which contains
    // information about Fiber's work (but which we should treat as an opaque
    // handle).
    const root = GtkReconciler.createContainer(containerInfo, false, false);

    // Kick off a render by asking our reconciler to update the react container
    // above with the element the user provided.
    GtkReconciler.updateContainer(element, root, undefined, callback);

    // Start the GTK event loop.
    containerInfo.startGtk();
  }
};

export default ReacTK;
