/* globals Wsh: false */
/* globals process: false */

(function () {
  if (Wsh && Wsh.Logger) return;

  /**
   * The logger module for WSH (Windows Script Host) that writes logging messages in a console or a file or Windows-Event-Viewer.
   *
   * @namespace Logger
   * @memberof Wsh
   * @requires {@link https://github.com/tuckn/WshModeJs|tuckn/WshModeJs}
   */
  Wsh.Logger = {};

  // Shorthands
  var sh = Wsh.Shell;
  var util = Wsh.Util;
  var CD = Wsh.Constants;
  var path = Wsh.Path;
  var os = Wsh.OS;
  var fs = Wsh.FileSystem;
  var fse = Wsh.FileSystemExtra;

  var insp = util.inspect;
  var obtain = util.obtainPropVal;
  var isPlainObject = util.isPlainObject;
  var isSolidString = util.isSolidString;
  var hasIn = util.hasIn;
  var hasContent = util.hasContent;
  var parseDate = util.createDateString;
  var parseDateLiteral = util.parseDateLiteral;

  var logger = Wsh.Logger;

  /** @constant {string} */
  var MODULE_TITLE = 'WshLogger/Logger.js';

  var throwErrNonStr = function (functionName, typeErrVal) {
    util.throwTypeError('string', MODULE_TITLE, functionName, typeErrVal);
  };

  var lvPriority = {
    off: 0,
    error: 1,
    warn: 2,
    success: 3,
    info: 4,
    debug: 5
  };

  // _parseLogsToStr {{{
  /**
   * @private
   * @param {Array} logs - An Array of logs to parse.
   * @param {object} [options] - Optional parameters.
   * @param {boolean} [options.eolChar] - Default is {@link https://docs.tuckn.net/WshOS/Wsh.OS.html#.EOL|Wsh.OS.EOL}.
   * @returns {void}
   */
  function _parseLogsToStr (logs, options) {
    var eolChar = hasIn(options, 'eolChar') ? options.eolChar : os.EOL;

    var logStr = '';
    var log, lv; // Shorthand
    var lvDisp = {
      debug: 'debug   ',
      info: 'info    ',
      success: 'success ',
      warn: 'warn    ',
      error: 'error   '
    };

    for (var i = 0, I = logs.length; i < I; i++) {
      log = logs[i]; // shorthand
      logStr += '[' + log.timestamp + ']';
      lv = isSolidString(log.level) ? log.level : 'info';
      logStr += ' ' + lvDisp[lv] + log.message + eolChar;
    }

    return logStr;
  } // }}}

  // _createLogObj {{{
  /**
   * @private
   * @param {string} level
   * @param {string} message
   * @returns {object}
   */
  function _createLogObj (level, message) {
    return {
      timestamp: parseDate('yyyy-MM-ddTHH:mm:ss'),
      level: level,
      message: message
    };
  } // }}}

  // _showLogsWithConsole {{{
  /**
   * [W.I.P] @TODO Create a result console window when running wscript.exe
   *
   * @private
   * @param {string} logStr - A String of logs to output.
   * @returns {void}
   */
  function _showLogsWithConsole (logStr) {
    // Save the logStr on a temporary file.
    var tmpLog = os.makeTmpPath('WshLogWriter_', '.log');
    fs.writeFileSync(tmpLog, logStr, { encoding: os.cmdCodeset() });

    var cmdCode = 'TYPE "' + tmpLog + '"\r\n@PAUSE';
    var tmpCmd = tmpLog.replace('.log', '.cmd');
    fs.writeFileSync(tmpCmd, cmdCode, { encoding: CD.ado.charset.utf8 });

    // Show the file content with CMD.exe type
    sh.Run('CMD.EXE /S /K"' + tmpCmd + '"', CD.windowStyles.activeDef, false);
    // child_process.execFile(tmpCmd);

    /**
     * @FIXME Remove tmp. .log and .cmd
     * If you write the following code to remove the temporary files, not work.
     */
    // try {
    //   fse.removeSync(tmpLog);
    //   fse.removeSync(tmpCmd);
    // } catch (e) {
    //   // Ignore the error
    // }
  } // }}}

  // _Logger {{{
  /**
   * @typedef {object} typeLoggerCreateOptions
   * @property {string} [level=null] - debug, info, success, warn, error, off
   * @property {string|_Logger} transportation - console, popup, winEvent, `filepath`. Can use a date string (e.g. "C:\\My log\\#{yyyy-MM-dd}.log" -> 2019-10-29.log) or _Logger instance
   * @property {string} [encoding] - Default: {@link Wsh.Constants.UTF8}. A log file encoding
   */

  /**
   * @private
   * @class _Logger
   * @param {typeLoggerCreateOptions} params
   */
  function _Logger (params) {
    // Constructor
    this.level = obtain(params, 'level', 'info').toLowerCase();

    var dest = obtain(params, 'transportation', 'console');
    if (/^none$/i.test(dest)) {
      this.transportation = 'NONE';
    } else if (/^console$/i.test(dest)) {
      this.transportation = 'CONSOLE';
    } else if (/^popup$/i.test(dest)) {
      this.transportation = 'POPUP';
    } else if (/^winevent$/i.test(dest)) {
      this.transportation = 'WINEVENT';
    } else {
      this.transportation = 'FILE';
      dest = path.resolve(dest);

      this.logPath = parseDateLiteral(dest);
      if (fs.existsSync(this.logPath)) {
        if (fs.statSync(this.logPath).isDirectory()) {
          this.logPath = path.join(this.logPath, parseDate() + '.log');
        }
      }
    }

    // this.runsCscript = /cscript\.exe$/i.test(process.execPath);
    this.encoding = obtain(params, 'encoding', CD.ado.charset.utf8);
    this.logs = [];
    this.stackingLogs = [];
    // The level for a result (Enable on 'popup', 'winEvent')
    this.logLevelResult = 'info';

    // Methods

    // clear {{{
    /**
     * Clears all info of the logger instance.
     *
     * @memberof Wsh.Logger
     * @returns {void}
     */
    this.clear = function () {
      this.logs = [];
      this.logLevelResult = 'info';
    }; // }}}

    // setLevel {{{
    /**
     * Sets the logging level.
     *
     * @memberof Wsh.Logger
     * @param {string} level - The log level to set.
     * @returns {void}
     */
    this.setLevel = function (level) {
      this.level = level.toLowerCase();
    }; // }}}

    // stackLog {{{
    /**
     * Stores the log to output.
     *
     * @memberof Wsh.Logger
     * @param {object} obj
     * @param {string} object.level
     * @param {string} object.message
     * @returns {void}
     */
    this.stackLog = function (obj) {
      var level = obtain(obj, 'level', null).toLowerCase();
      if (!this.outputsLog(level)) return;

      this.stackingLogs.push(_createLogObj(level, obj.message));
    }; // }}}

    // clearStackingLogs {{{
    /**
     * Clears the stacking logs to output.
     *
     * @memberof Wsh.Logger
     * @returns {void}
     */
    this.clearStackingLogs = function () {
      this.stackingLogs = [];
    }; // }}}

    // outputsLog {{{
    /**
     * Checks the log whether the level to output.
     *
     * @memberof Wsh.Logger
     * @param {string} level
     * @returns {boolean}
     */
    this.outputsLog = function (level) {
      var functionName = 'outputsLog';
      if (!isSolidString(level)) throwErrNonStr(functionName, level);

      if (lvPriority[this.logLevelResult] > lvPriority[level]) {
        this.logLevelResult = level; // Update the result level
      }

      if (level === 'off') return false;

      if (level === 'debug' && process.env.WSH_ENV === 'development') {
        return true;
      }

      if (lvPriority[this.level] < lvPriority[level]) return false;
      return true;
    }; // }}}

    // log {{{
    /**
     * Adds the log.
     *
     * @example
     * var logger = Wsh.Logger.create();
     *
     * logger.log({ level: 'info', message: 'Information message' });
     * // The above is equal with `logger.info('Information message');`
     * @memberof Wsh.Logger
     * @param {object} obj - The object to log.
     * @param {string} obj.level - The logging level.
     * @param {string} obj.message - The logging message.
     * @returns {void}
     */
    this.log = function (obj) {
      var level = obtain(obj, 'level', null).toLowerCase();
      if (!this.outputsLog(level)) return;

      if (this.stackingLogs.length > 0) {
        this.logs = this.logs.concat(this.stackingLogs);
        this.clearStackingLogs();
      }

      var message = obtain(obj, 'message', '');

      this.logs.push(_createLogObj(level, message));

      // Realtime showing
      if (this.transportation === 'CONSOLE') {
        var parsedLog = _parseLogsToStr(this.logs, { eolChar: '' });

        if (level === 'error') {
          console.error(parsedLog);
        } else {
          console.log(parsedLog);
        }

        this.clear();
      }
    }; // }}}

    // debug {{{
    /**
     * If process.env.WSH_ENV is 'development', add the log of info level.
     *
     * @example
     * var logger = Wsh.Logger.create();
     *
     * logger.debug('Debug message as info');
     * // The above is equal with `logger.log('debug', 'Debug message as info');`
     * @memberof Wsh.Logger
     * @param {string} [message]
     * @returns {void}
     */
    this.debug = function (message) {
      this.log({ level: 'debug', message: message });
    }; // }}}

    // info {{{
    /**
     * Adds the log of info level.
     *
     * @example
     * var logger = Wsh.Logger.create();
     *
     * logger.info('Information message');
     * // The above is equal with `logger.log('info', 'Information message');`
     * @memberof Wsh.Logger
     * @param {string} [message]
     * @returns {void}
     */
    this.info = function (message) {
      this.log({ level: 'info', message: message });
    }; // }}}

    // success {{{
    /**
     * Adds the log of success level.
     *
     * @example
     * var logger = Wsh.Logger.create();
     *
     * logger.success('Success message');
     * // The above is equal with `logger.log('success', 'Success message');`
     * @memberof Wsh.Logger
     * @param {string} [message]
     * @returns {void}
     */
    this.success = function (message) {
      this.log({ level: 'success', message: message });
    }; // }}}

    // warn {{{
    /**
     * Adds the log of warn level.
     *
     * @example
     * var logger = Wsh.Logger.create();
     *
     * logger.warn('Warnning message');
     * // The above is equal with `logger.log('warn', 'Warnning message');`
     * @memberof Wsh.Logger
     * @param {string} [message]
     * @returns {void}
     */
    this.warn = function (message) {
      this.log({ level: 'warn', message: message });
    }; // }}}

    // error {{{
    /**
     * Adds the log of error level.
     *
     * @example
     * var logger = Wsh.Logger.create();
     *
     * logger.error('Error message');
     * // The above is equal with `logger.log('error', 'Error message');`
     * @memberof Wsh.Logger
     * @param {string} [message]
     * @returns {void}
     */
    this.error = function (message) {
      this.log({ level: 'error', message: message });
    }; // }}}

    // transport {{{
    /**
     * Outputs the storing logs and clears.
     *
     * @memberof Wsh.Logger
     * @returns {void}
     */
    this.transport = function () {
      var functionName = 'transport';

      if (this.transportation === null || this.transportation === 'NONE') {
        return;
      }

      var logStr = '';
      if (this.transportation === 'FILE') {
        try {
          logStr = fs.readFileSync(this.logPath, { encoding: this.encoding });
        } catch (e) {
          var errStr = insp(e);

          if (/no such file or directory/i.test(errStr)) {
            logStr = ''; // Ignores this error.
          } else {
            throw e;
          }
        }
      }

      logStr += _parseLogsToStr(this.logs);

      if (logStr == '') return this.clear();

      if (this.transportation === 'CONSOLE') {
        console.log(logStr);
      } else if (this.transportation === 'POPUP') {
        var ico = /^error$/i.test(this.logLevelResult)
          ? CD.iconTypes.stop : (
            /^warn$/i.test(this.logLevelResult)
            ? CD.iconTypes.excl : CD.iconTypes.infomaiton);

        /**
         * Displays text in a pop-up message box. {@link https://msdn.microsoft.com/ja-jp/library/cc364428.aspx|Microsoft Docs}
         *
         * @function Popup
         * @memberof Wsh.Shell
         * @param {string} strText
         * @param {number} [nSecondsToWait]
         * @param {string} [strTitle]
         * @param {number} [nType] The value of {@link Wsh.Constants.buttonTypes} and The value of {@link Wsh.Constants.iconTypes}
         * @returns {number} - A value of {@link Wsh.Constants.enterCodes}
         */
        sh.Popup(logStr, CD.nonAutoClosing, MODULE_TITLE, CD.buttonTypes.ok + ico);
      } else if (this.transportation === 'WINEVENT') {
        os.writeLogEvent[this.logLevelResult](logStr);
      } else if (this.transportation === 'FILE') {
        try {
          fse.ensureDirSync(path.dirname(this.logPath));
          fs.writeFileSync(this.logPath, logStr, { encoding: this.encoding });
        } catch (e) {
          throw new Error(insp(e) + '\n'
              + '  at ' + functionName + ' (' + MODULE_TITLE + ')\n'
              + '  Failed to write the log "' + this.logPath + '"');
        }
      }

      this.clear();
    }; // }}}
  } // }}}

  // logger.create {{{
  /**
   * Creates the new instance of Wsh.Logger.
   *
   * @example
   * // Ex.1 Default: Output Console
   * var logger = Wsh.Logger.create();
   * // or `var logger = Wsh.Logger.create('info/console');`
   * // or `var logger = Wsh.Logger.create({ level: 'info', transportation: 'console' });`
   *
   * logger.error('Error message');
   * logger.warn('Warn message');
   * logger.success('Success message');
   * logger.info('Info message');
   *
   * logger.transport();
   * // Displays the following logs in Commandprompt
   * // [2020-03-02T15:31:01] error   Error message
   * // [2020-03-02T15:31:02] warn    Warn message
   * // [2020-03-02T15:31:03] success Success message
   * // [2020-03-02T15:31:04] info    Info message
   * @example
   * // Ex.2 Output Popup Window
   * var logger = Wsh.Logger.create('warn/popup');
   *
   * logger.error('Error message');
   * logger.warn('Warn message');
   * logger.success('Success message');
   * logger.info('Info message');
   *
   * logger.transport();
   * // Displays the following logs in a popup window
   * // [2020-03-02T15:31:01] error   Error message
   * // [2020-03-02T15:31:02] warn    Warn message
   * @example
   * // Ex.3 Output File
   * var logger = Wsh.Logger.create('success/foo_{yyyy-MM-dd}.log');
   *
   * logger.error('Error message');
   * logger.warn('Warn message');
   * logger.success('Success message');
   * logger.info('Info message');
   *
   * logger.transport();
   * // Writes the logs into %CD%\foo_2020-03-02.log
   * // [2020-03-02T15:31:01] error   Error message
   * // [2020-03-02T15:31:02] warn    Warn message
   * // [2020-03-02T15:31:03] success Success message
   * @example
   * // Ex.4 Output Windows Event Viewer
   * var logger = Wsh.Logger.create('error/winEvent');
   *
   * logger.error('Error message');
   * logger.warn('Warn message');
   * logger.success('Success message');
   * logger.info('Info message');
   *
   * logger.transport();
   * // Adds the following log on your Windows Event Viewer
   * // [2020-03-02T15:31:01] error   Error message
   * @function create
   * @memberof Wsh.Logger
   * @param {(string|typeLoggerCreateOptions|_Logger)} [options] - "`level`/`transportation`" or options or _Logger instance
   * @returns {_Logger} - _Logger instance
   */
  logger.create = function (options) {
    var functionName = 'logger.create';
    var level, transportation, encoding;

    if (options instanceof _Logger) return options;

    if (isSolidString(options)) {
      var args = options.split('/');

      if (args.length > 1) {
        level = args[0];
        transportation = args[1];
      } else {
        level = args[0];
      }

      return new _Logger({ level: level, transportation: transportation });
    }

    if (isPlainObject(options)) {
      level = obtain(options, 'level', null);
      transportation = obtain(options, 'transportation', null);
      encoding = obtain(options, 'encoding', CD.ado.charset.utf8);

      if (transportation instanceof _Logger) {
        if (isSolidString(level)) transportation.setLevel(level);
        return transportation;
      }

      return new _Logger({
        level: level,
        transportation: transportation,
        encoding: encoding
      });
    }

    if (!hasContent(options)) {
      return new _Logger({
        level: null, transportation: null, encoding: null
      });
    }

    throw new Error('Error [ERR_INVALID_ARG_TYPE]\n'
      + '  at ' + functionName + ' (' + MODULE_TITLE + ')\n'
      + '  options: ' + insp(options));
  }; // }}}
})();

// vim:set foldmethod=marker commentstring=//%s :
