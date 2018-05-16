# ReacTK

Experiments in controlling GTK+ 3 with React.

## Installing

### macOS

```
brew install gobject-introspection gtk+3
PKG_CONFIG_PATH="/usr/local/opt/libffi/lib/pkgconfig" npm i
```

### Others

I'm not sure, but you need GKT+ 3 and gobject-introspection installed from your package manager of choice. Hopefully the output of `npm install` guides your way.

## Testing

```
./node_modules/.bin/ts-node examples/reactk-test.tsx
```

## FAQ

**Why is the app opening in the background on macOS?**

From https://github.com/andlabs/libui#why-does-my-program-start-in-the-background-on-os-x-if-i-run-from-the-command-line:

> OS X normally does not start program executables directly; instead, it uses [Launch Services](https://developer.apple.com/reference/coreservices/1658613-launch_services?language=objc) to coordinate the launching of the program between the various parts of the system and the loading of info from an .app bundle. One of these coordination tasks is responsible for bringing a newly launched app into the foreground. This is called "activation".
>
> When you run a binary directly from the Terminal, however, you are running it directly, not through Launch Services. Therefore, the program starts in the background, because no one told it to activate! Now, it turns out [there is an API](https://developer.apple.com/reference/appkit/nsapplication/1428468-activateignoringotherapps) that we can use to force our app to be activated. But if we use it, then we'd be trampling over Launch Services, which already knows whether it should activate or not. Therefore, libui does not step over Launch Services, at the cost of requiring an extra user step if running directly from the command line.
>
> See also [this](https://github.com/andlabs/libui/pull/20#issuecomment-211381971) and [this](http://stackoverflow.com/questions/25318524/what-exactly-should-i-pass-to-nsapp-activateignoringotherapps-to-get-my-appl).
