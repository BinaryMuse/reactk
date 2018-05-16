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
