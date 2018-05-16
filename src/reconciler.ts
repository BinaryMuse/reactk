import * as ReactReconciler from "react-reconciler";
import gtk from "../gtk";
import { WidgetWrapper, DEFAULT_HOST_CONTEXT } from "./widget";

const hostConfig = {
  getRootHostContext(rootContainerInstance) {
    return DEFAULT_HOST_CONTEXT;
  },

  getChildHostContext(parentHostContext, type, instance) {
    return parentHostContext;
  },

  getPublicInstance(instance) {
    if (instance instanceof WidgetWrapper) {
      return instance.getGtkWidget();
    }

    return instance;
  },

  createInstance(
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    const Type = WidgetWrapper.forType(type);
    return new Type(type, props, rootContainerInstance, hostContext);
  },

  appendInitialChild(parentInstance, child) {
    parentInstance.add(child);
  },

  finalizeInitialChildren(
    parentInstance,
    type,
    props,
    rootContainerInstance,
    hostContext
  ) {
    parentInstance.finalizeInitialChildren(
      props,
      rootContainerInstance,
      hostContext
    );
  },

  prepareUpdate(
    instance,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
    hostContext
  ) {
    // TODO
  },

  shouldSetTextContent(type, props): boolean {
    const Type = WidgetWrapper.forType(type);
    return Type.shouldSetTextContent(props);
  },

  shouldDeprioritizeSubtree(type, props): boolean {
    return false;
  },

  createTextInstance(
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    // TODO: create label or something
  },

  scheduleDeferredCallback(callback, options?: { timeout: number }): number {
    console.log("scheduleDeferredCallback");
    const timeout = options ? options.timeout : 0;
    return setTimeout(callback, timeout);
  },

  cancelDeferredCallback(callbackId: number) {
    clearTimeout(callbackId);
  },

  prepareForCommit(containerInfo) {
    // Anything to do here? Maybe disable GTK signals?
  },

  resetAfterCommit(containerInfo) {
    // ^^^
  },

  now(): number {
    return ~~new Date();
  },

  isPrimaryRenderer: true,

  mutation: {
    commitUpdate(
      instance,
      updatePayload,
      type,
      oldProps,
      newProps,
      internalInstanceHandle
    ) {
      console.log("commitUpdate");
    },

    commitMount(instance, type, newProps, internalInstanceHandle) {
      // When does this get called?
      console.log("commitMount", instance, type, newProps);
    },

    commitTextUpdate(textInstance, oldText, newText) {
      console.log("commitTextUpdate");
    },

    resetTextContent(textInstance) {
      console.log("resetTextContent");
    },

    appendChild(parentInstance, child) {
      parentInstance.add(child);
    },

    appendChildToContainer(container, child) {
      container.startGtk();
    },

    insertBefore(parentInstane, child, beforeChild) {
      console.log("insertBefore");
    },

    insertInContainerBefore(container, child, beforeChild) {
      console.log("insertIntoContainerBefore");
    },

    removeChild(parentInstance, child) {
      parentInstance.remove(child);
    },

    removeChildFromContainer(container, child) {
      console.log("removeChildFromContainer");
    }
  }
};

const GtkReconciler = ReactReconciler(hostConfig);
export default GtkReconciler;
