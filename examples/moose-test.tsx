/// <reference path="../index.d.ts" />

import * as React from "react";
import ReacTK from "../index";
import { Gtk as gtk } from "node-gir";

interface AppState {
  clickCount: number;
  mooses: string[];
}

const mooses = [
  "adorable-moose.jpg",
  "car-moose.jpg",
  "couch-moose.jpg",
  "curios-moose.jpg",
  "park-moose.jpg",
  "pee-moose.jpg",
  "pet-moose.jpg",
  "programmer-moose.jpg",
  "sleepy-moose.jpg"
].map(moose => `/Users/mtilley/Pictures/moose/${moose}`);
var rand = () => mooses[Math.floor(Math.random() * mooses.length)];

var [screenWidth, screenHeight] = require("screenres").get();

class MooseWindow extends React.Component<{ file: string }, {}> {
  win: any;

  render() {
    return (
      <window
        ref={c => {
          this.win = c;
        }}
        type={gtk.WindowType.TOPLEVEL}
        title="Moose!"
        resizable={true}
        defaultWidth={100}
        defaultHeight={100}
        windowPosition={gtk.WindowPosition.MOUSE}
      >
        {/* <button>It's a moose!</button> */}
        <image file={this.props.file} />
      </window>
    );
  }

  componentDidMount() {
    // console.log(this.win);
  }
}

class Application extends React.Component<{}, AppState> {
  win: any;

  state = {
    clickCount: 0,
    mooses: []
  };

  componentDidUpdate() {
    if (this.win) {
      this.win.present();
    }
  }

  render() {
    let btnText = "Say hello to Moose!";
    if (this.state.clickCount > 0) {
      btnText = `${this.state.clickCount} Mooses!`;
    }

    return (
      <>
        {this.state.mooses.map(this.renderMoose.bind(this))}
        <window
          ref={c => {
            this.win = c;
          }}
          type={gtk.WindowType.TOPLEVEL}
          title="It's Moose!"
          resizable={true}
          windowPosition={gtk.WindowPosition.CENTER}
          borderWidth={10}
          defaultWidth={200}
          defaultHeight={100}
          onDestroy={() => process.exit()}
        >
          <button onClicked={this.handleClick.bind(this)}>{btnText}</button>
        </window>
      </>
    );
  }

  handleClick() {
    this.setState(state => {
      const clickCount = state.clickCount + 1;
      const newMoose = rand();
      const mooses = state.mooses.concat([newMoose]);
      return { clickCount, mooses };
    });
  }

  renderMoose(whichMoose, number) {
    return <MooseWindow file={whichMoose} />;
  }
}

ReacTK.render(<Application />, gtk, () => {
  console.log("Started!");
});
