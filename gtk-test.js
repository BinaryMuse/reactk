const { Gtk } = require('node-gir')

const win = new Gtk.Window({
  type: Gtk.WindowType.TOPLEVEL,
  title: 'Node.js Test GTK Window'
})
win.setBorderWidth(10)

const button = new Gtk.Button()
button.setLabel("Hello, world!")
win.add(button)

win.connect("destroy", () => {
  Gtk.mainQuit()
})

let clickCount = 0
button.connect("clicked", () => {
  button.setLabel(`Clicked ${++clickCount} times`)
})

win.showAll()
Gtk.main()
