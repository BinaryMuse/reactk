/// <reference path="../index.d.ts" />

import * as React from "react";
import ReacTK from "../index";
import { Gtk as gtk } from "node-gir";

interface AppState {
  clickCount: number;
}

class Application extends React.Component<{}, AppState> {
  state = {
    clickCount: 0
  };

  render() {
    let btnText = "Hello, world!";
    if (this.state.clickCount > 0) {
      btnText = `Clicked ${this.state.clickCount} times`;
    }

    return (
      <window
        type={gtk.WindowType.TOPLEVEL}
        title={`ReacTK Test! ${this.state.clickCount}`}
        resizable={true}
        windowPosition={gtk.WindowPosition.CENTER}
        borderWidth={10 + this.state.clickCount}
      >
        <button onClicked={this.handleClick.bind(this)}>{btnText}</button>
      </window>
    );
  }

  handleClick() {
    this.setState(state => {
      const clickCount = state.clickCount + 1;
      return { clickCount };
    });
  }
}

ReacTK.render(<Application />, gtk, () => {
  console.log("Started!");
});
