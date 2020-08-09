# WshLogger

The logger module for WSH (Windows Script Host) that writes logging messages in a console or a file or Windows-Event-Viewer.

## tuckn/WshModeJs basic applications structure

[WshBasicApps](https://github.com/tuckn/WshBasicPackage)  
&emsp;&emsp;├─ [WshCommander](https://github.com/tuckn/WshCommander)  
&emsp;&emsp;├─ [WshConfigStore](https://github.com/tuckn/WshConfigStore) (./dist/module.js)  
&emsp;&emsp;├─ [WshDotEnv](https://github.com/tuckn/WshDotEnv) (./dist/module.js)  
&emsp;&emsp;├─ WshLogger - This repository (./dist/module.js)  
&emsp;&emsp;└─ [WshModeJs](https://github.com/tuckn/WshModeJs) (./dist/bundle.js)

WshBasicApps can use all the above modules functions.

## Operating environment

Works on JScript in Windows.

## Installation

(1) Create a directory of your WSH project.

```console
D:\> mkdir MyWshProject
D:\> cd MyWshProject
```

(2) Download this ZIP and unzipping or Use the following `git` command.

```console
> git clone https://github.com/tuckn/WshLogger.git ./WshModules/WshLogger
or
> git submodule add https://github.com/tuckn/WshLogger.git ./WshModules/WshLogger
```

(3) Include _.\\WshLogger\\dist\\bundle.js_ into your .wsf file.
For Example, if your file structure is

```console
D:\MyWshProject\
├─ Run.wsf
├─ MyScript.js
└─ WshModules\
    └─ WshLogger\
        └─ dist\
          └─ bundle.js
```

The content of above _Run.wsf_ is

```xml
<package>
  <job id = "run">
    <script language="JScript" src="./WshModules/WshLogger/dist/bundle.js"></script>
    <script language="JScript" src="./MyScript.js"></script>
  </job>
</package>
```

I recommend this .wsf file encoding to be UTF-8 [BOM, CRLF].
This allows the following functions to be used in _.\\MyScript.js_.

### Together with another WshModeJs Apps

If you want to use it together with another WshModeJs Apps, install as following

```console
> git clone https://github.com/tuckn/WshModeJs.git ./WshModules/WshModeJs
> git clone https://github.com/tuckn/WshCommander.git ./WshModules/WshCommander
> git clone https://github.com/tuckn/WshLogger.git ./WshModules/WshLogger
or
> git submodule add https://github.com/tuckn/WshModeJs.git ./WshModules/WshModeJs
> git submodule add https://github.com/tuckn/WshCommander.git ./WshModules/WshCommander
> git submodule add https://github.com/tuckn/WshLogger.git ./WshModules/WshLogger
```

```xml
<package>
  <job id = "run">
    <script language="JScript" src="./WshModules/WshModeJs/dist/bundle.js"></script>
    <script language="JScript" src="./WshModules/WshCommander/dist/module.js"></script>
    <script language="JScript" src="./WshModules/WshLogger/dist/module.js"></script>
    <script language="JScript" src="./MyScript.js"></script>
  </job>
</package>
```

If you have no special circumstances, I recommend using [WshBasicApps](https://github.com/tuckn/WshBasicPackage).

## Usage

Now _.\\MyScript.js_ (JScript ) can use `Wsh.Logger`.
For example.

```js
var logger = Wsh.Logger; // Shorthand

var lggr = logger.create('warn/winEvent'); // Set warn level
lggr.error('1 Error message');
lggr.warn('2 Warning message');
lggr.success('3 Success message');
lggr.info('4 Info message');
lggr.debug('5 Debug message');

logger.transport();
// Creates the new error event into your Windows Event Viewer.
// [2020-07-19T13:11:09] error   1 Error message
// [2020-07-19T13:11:09] warn    2 Warning message
```

It was specified `warn` level, `success`, `info` and `debug` are not recorded.

### Logging Levels

The hierarchy of logging levels are as follows in Highest to Lowest order:

- error
- warn
- success
- info
- debug

### Output Console

```js
var logger = Wsh.Logger; // Shorthand

var lggr = logger.create('info/console');
// Specifyed `console`, it works like console.log.
lggr.error('1 Error message'); // console.error
lggr.warn('2 Warning message'); // console.log
lggr.success('3 Success message'); // console.log
lggr.info('4 Info message'); // console.log
lggr.debug('5 Debug message');
```

```console
> cscript .\Run.wsf
[2020-07-19T13:11:09] error   1 Error message
[2020-07-19T13:11:09] warn    2 Warning message
[2020-07-19T13:11:09] success 3 Success message
[2020-07-19T13:11:09] info    4 Info message
```

### Output Popup Window

```js
var logger = Wsh.Logger; // Shorthand

var lggr = logger.create('error/popup');
lggr.error('1 Error message');
lggr.warn('2 Warning message');
lggr.success('3 Success message');
lggr.info('4 Info message');
lggr.debug('5 Debug message');

logger.transport();
```

![WshLogger/Popup Window](https://docs.tuckn.net/WshLogger/img/log-popup-window.png)

### Output File

```js
var logger = Wsh.Logger; // Shorthand

var lggr = logger.create('success/D:\\logs\\foo_#{yyyy-MM-dd}.log');
lggr.error('1 Error message');
lggr.warn('2 Warning message');
lggr.success('3 Success message');
lggr.info('4 Info message');
lggr.debug('5 Debug message');

logger.transport();
```

Writes the logs into _D:\\logs\\foo_2020-07-19.log_.

```log
[2020-07-19T13:11:09] error   1 Error message
[2020-07-19T13:11:09] warn    2 Warning message
[2020-07-19T13:11:09] success 3 Success message
```

If you omit the directory path, for example `'warn/foo_#{yyyy-MM-dd}.log'`, the `%CD%` (Current Working Directory) will be applied.

### Dependency Modules

You can also use the following useful functions in _.\\MyScript.js_ (JScript).

- [tuckn/WshPolyfill](https://github.com/tuckn/WshPolyfill)
- [tuckn/WshUtil](https://github.com/tuckn/WshUtil)
- [tuckn/WshPath](https://github.com/tuckn/WshPath)
- [tuckn/WshOS](https://github.com/tuckn/WshOS)
- [tuckn/WshFileSystem](https://github.com/tuckn/WshFileSystem)
- [tuckn/WshProcess](https://github.com/tuckn/WshProcess)
- [tuckn/WshChildProcess](https://github.com/tuckn/WshChildProcess)
- [tuckn/WshNet](https://github.com/tuckn/WshNet)
- [tuckn/WshModeJs](https://github.com/tuckn/WshModeJs)

## Documentation

See all specifications [here](https://docs.tuckn.net/WshLogger) and also below.

- [WshPolyfill](https://docs.tuckn.net/WshPolyfill)
- [WshUtil](https://docs.tuckn.net/WshUtil)
- [WshPath](https://docs.tuckn.net/WshPath)
- [WshOS](https://docs.tuckn.net/WshOS)
- [WshFileSystem](https://docs.tuckn.net/WshFileSystem)
- [WshProcess](https://docs.tuckn.net/WshProcess)
- [WshChildProcess](https://docs.tuckn.net/WshChildProcess)
- [WshNet](https://docs.tuckn.net/WshNet)
- [WshModeJs](https://docs.tuckn.net/WshModeJs)

## License

MIT

Copyright (c) 2020 [Tuckn](https://github.com/tuckn)
