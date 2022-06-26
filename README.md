# WshLogger

The logger module for WSH (Windows Script Host) writes logging messages in a console or a file or Windows-Event-Viewer.

## tuckn/WshModeJs basic applications structure

[WshBasicApps](https://github.com/tuckn/WshBasicPackage)  
&emsp;&emsp;├─ [WshCommander](https://github.com/tuckn/WshCommander)  
&emsp;&emsp;├─ [WshConfigStore](https://github.com/tuckn/WshConfigStore) (./dist/module.js)  
&emsp;&emsp;├─ [WshDotEnv](https://github.com/tuckn/WshDotEnv) (./dist/module.js)  
&emsp;&emsp;├─ WshLogger - This repository (./dist/module.js)  
&emsp;&emsp;└─ [WshModeJs](https://github.com/tuckn/WshModeJs) (./dist/bundle.js)  

WshBasicApps contains all the above modules.

## Operating environment

Works on JScript in Windows.

## Installation

(1) Create a directory of your WSH project.

```console
D:\> mkdir MyWshProject
D:\> cd MyWshProject
```

(2) Download this ZIP and unzip or Use the following `git` command.

```console
> git clone https://github.com/tuckn/WshLogger.git ./WshModules/WshLogger
or
> git submodule add https://github.com/tuckn/WshLogger.git ./WshModules/WshLogger
```

(3) Create your JScript (.js) file. For Example,

```console
D:\MyWshProject\
├─ MyScript.js <- Your JScript code will be written in this.
└─ WshModules\
    └─ WshLogger\
        └─ dist\
          └─ bundle.js
```

I recommend JScript (.js) file encoding to be UTF-8 [BOM, CRLF].

(4) Create your WSF packaging scripts file (.wsf).

```console
D:\MyWshProject\
├─ Run.wsf <- WSH entry file
├─ MyScript.js
└─ WshModules\
    └─ WshLogger\
        └─ dist\
          └─ bundle.js
```

And you should include _.../dist/bundle.js_ into the WSF file.
For Example, The content of the above _Run.wsf_ is

```xml
<package>
  <job id = "run">
    <script language="JScript" src="./WshModules/WshLogger/dist/bundle.js"></script>
    <script language="JScript" src="./MyScript.js"></script>
  </job>
</package>
```

I recommend this WSH file (.wsf) encoding to be UTF-8 [BOM, CRLF].

Awesome! This WSH configuration allows you to use the following functions in JScript (_.\\MyScript.js_).

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

### Logging Levels

As shown above, if you specify `warn` level in the `create` argument, the `success`, `info`, and `debug` defined in the code are not recorded as logs.

The hierarchy of logging levels is as follows in Highest to Lowest order:

- off
- error
- warn
- success
- info
- debug

For example, if you specify `off`, a log is not recorded.

### Output Console

```js
var logger = Wsh.Logger; // Shorthand

var lggr = logger.create('info/console');
// Specified `console`, it works like console.log.
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

If you omit the directory path, for example, `'warn/foo_#{yyyy-MM-dd}.log'`, the `%CD%` (Current Working Directory) will be applied.

### No Logging

```js
var logger = Wsh.Logger; // Shorthand

var lggr = logger.create('off');
lggr.error('1 Error message');
lggr.warn('2 Warning message');
lggr.success('3 Success message');
lggr.info('4 Info message');
lggr.debug('5 Debug message');

logger.transport(); // Non logging
```

### Together with another WshModeJs Apps

If you want to use it together with other WshModeJs Apps, install as following

```console
> git clone https://github.com/tuckn/WshModeJs.git ./WshModules/WshModeJs
> git clone https://github.com/tuckn/WshCommander.git ./WshModules/WshCommander
> git clone https://github.com/tuckn/WshLogger.git ./WshModules/WshLogger
or
> git submodule add https://github.com/tuckn/WshModeJs.git ./WshModules/WshModeJs
> git submodule add https://github.com/tuckn/WshCommander.git ./WshModules/WshCommander
> git submodule add https://github.com/tuckn/WshLogger.git ./WshModules/WshLogger
```

The definition in the WSF packaging scripts file (.wsf) is as follows.

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

Please note the difference between `.../dist/bundle.js` and `.../dist/module.js`.

I recommend using [WshBasicApps](https://github.com/tuckn/WshBasicPackage).
That includes all modules.

### Dependency Modules

You can also use the following helper functions in your JScript (_.\\MyScript.js_).

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
