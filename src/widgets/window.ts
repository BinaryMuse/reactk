import { WidgetWrapper } from "../widget";
import { Props, Container, HostContext } from "../utils";

export default class Window extends WidgetWrapper {
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
