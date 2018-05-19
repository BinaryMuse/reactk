import { WidgetWrapper } from "../widget";
import { Props, HostContext, UpdatePayload, Container } from "../utils";

export default class Button extends WidgetWrapper {
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
