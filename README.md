# VANO
A NANO light-wallet browser extension. It works with  NANO, a fast & fee-less currency secured by a decentralised network. The wallet stores all sensitive data locally (encrypted) and never communicates it to a server. 

**VANO is still in beta, *do not* store large amounts of NANO on this wallet!**

![Dashboard](https://github.com/marekhoeven/VANO/blob/master/dashboard.png)

## Deeplink support
The extension requires read/write access to allow for deeplink recognition on a browser. If detected, clicking on a deeplink will automatically open a popup with the amount & address filled in, ready to be send. This feature currently only works for Chrome/Brave users (showing a popup on firefox seems to be difficult). 

You can test deeplinks on my [DEMO page](https://marekhoeven.github.io/deeplink/). 

## How to run the extension locally (with deeplinks)

1. Download as ZIP and UNZIP into a folder
2. Open a terminal and 'cd' into the folder
3. Run:
```bash
$ npm install
$ npm run build
```

4. Open Chrome/Brave and enter as URL: 'chrome://extensions/' 
5. In the right-top corner toggle 'Developer mode'
6. In the left-top corner click 'Load unpacked'
7. Select the **dist**-folder inside your unzipped folder
8. Vano is now installed locally (don't remove the unzipped folder, otherwise the extension won't run anymore) and can be used together with [deeplinks](https://marekhoeven.github.io/deeplink/).

**:warning: WARNING: Please save your seed somewhere safe! If you uninstall/remove the extension, your imported seed is gone and has to be imported again**

## Some special commands for development:

#### `npm run build` 

Build the extension into `dist` folder for **production**.

#### `npm run build:dev` 

Build the extension into `dist` folder for **development**.

#### `npm run watch`

Watch for modifications then run `npm run build`.

#### `npm run watch:dev`

Watch for modifications then run `npm run build:dev`.

It also enable [Hot Module Reloading](https://webpack.js.org/concepts/hot-module-replacement), thanks to [webpack-chrome-extension-reloader](https://github.com/rubenspgcavalcante/webpack-chrome-extension-reloader) plugin. 

Keep in mind that HMR only works for your **background** entry.

#### `npm run build-zip`

Build a zip file following this format `<name>-v<version>.zip`, by reading `name` and `version` from `manifest.json` file.
Zip file is located in `dist-zip` folder.

## Todo

- Tests
- Add addressbook (alias system?)
- Optimalisation of JS functions
- Improve some shitty CSS (on components and globally)
- Documentation + better structure for teamwork 
- Set more user-option like a minimum receive amount
- Perhaps select what specific individual pendings to accept?

## Acknowledgements

Special thanks to the following repo's. You made the creation of this extension a lot easier. Thank you!

- [Kocal/vue-web-extension](https://github.com/Kocal/vue-web-extension) - Vue-web-extension template
- [cronoh/nanovault](https://github.com/cronoh/nanovault) - Nanovault wallet
- [numtel/nano-webgl-pow](https://github.com/numtel/nano-webgl-pow) - WebGL PoW Implementation
- [jaimehgb/RaiBlocksWebAssemblyPoW](https://github.com/jaimehgb/RaiBlocksWebAssemblyPoW) - CPU PoW Implementation
- [dcposch/blakejs](https://github.com/dcposch/blakejs) - Blake2b Implementation
- [dchest/tweetnacl-js](https://github.com/dchest/tweetnacl-js) - Cryptography Implementation

## Donate

If you like what I've made and/or are feeling generous, you can donate to me at
`xrb_1xrhezmywgmq3n13d5rdnntubdkafi8qnxjcmwj6wqhwis8go84m18639tue`
