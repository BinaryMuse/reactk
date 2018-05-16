import * as React from "react";
import { ReactElement } from "react";
import { Gtk as gtk } from "node-gir";

import GtkReconciler from "./src/reconciler";

class GtkApi {
  createGtkWidget(type, props) {
    const constructor = gtk[type]; // e.g. gtk.Window
    return new constructor(props);
  }

  stopGtk() {
    gtk.mainQuit();
  }
}

const ReacTK = {
  render(element, callback) {
    // Our container is a sort of "environment" in which the host React
    // application will live. It can be anything. Here, we're using an instance
    // of a GTK+ 3 API, but you might have a handle to a window, a reference to a
    // 3D drawing context, or some other dynamically allocated, non-global
    // resource.

    // Your renderer's container info is any information that the Reconciler
    // will need to do it's job during React's lifetime. Here we're using a
    // reference to a GTK+3 API, but you might have a handle to a native class
    // or a reference to some drawing context.
    //
    // React will make this object available to the Reconciler during certain
    // lifecycle hooks.
    const containerInfo = new GtkApi();

    // There's no way the React bindings created for a host environment can have
    // access to dynamic, non-global resources until runtime; so, we pass React
    // our container info, and it gives us back a fiber root, which contains
    // information about Fiber's work (but which we should treat as an opaque
    // handle).
    const root = GtkReconciler.createContainer(containerInfo, false, false);

    // Kick off a render by asking our reconciler to update the react container
    // above with the element the user provided.
    GtkReconciler.updateContainer(element, root, undefined, callback);
    gtk.main();
  }
};

export default ReacTK;
