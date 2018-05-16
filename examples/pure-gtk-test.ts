import { Gtk as gtk } from "node-gir";

const win = new gtk.Window({
  type: gtk.WindowType.TOPLEVEL,
  title: "Node.js Test GTK Window",
  resizable: false,
  "window-position": gtk.WindowPosition.CENTER,
  "border-width": 10
});
// win.setBorderWidth(10);

const button = new gtk.Button();
button.setLabel("Hello, world!");
win.add(button);

win.connect("destroy", () => {
  gtk.mainQuit();
});

let clickCount = 0;
button.connect("clicked", () => {
  button.setLabel(`Clicked ${++clickCount} times`);
});

win.showAll();
gtk.main();
