import * as ReactReconciler from "react-reconciler";

import { WidgetWrapper } from "./widget";
import { getDefaultHostContext } from "./utils";

const hostConfig = {
  getRootHostContext(rootContainerInstance) {
    return getDefaultHostContext();
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
    parentInstance.appendInitialChild(child);
  },

  finalizeInitialChildren(
    parentInstance,
    type,
    props,
    rootContainerInstance,
    hostContext
  ) {
    return parentInstance.finalizeInitialChildren(
      type,
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
    return instance.prepareUpdate(type, oldProps, newProps, hostContext);
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
      instance.commitUpdate(type, updatePayload, oldProps, newProps);
    },

    commitMount(instance, type, newProps, internalInstanceHandle) {
      instance.commitMount(type, newProps);
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
      // no-op
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
