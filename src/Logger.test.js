/* globals Wsh: false */
/* globals __filename: false */
/* globals process: false */

/* globals describe: false */
/* globals test: false */
/* globals expect: false */

// Shorthand
var CD = Wsh.Constants;
var util = Wsh.Util;
var path = Wsh.Path;
var os = Wsh.OS;
var fs = Wsh.FileSystem;
var fse = Wsh.FileSystemExtra;
var child_process = Wsh.ChildProcess;
var rl = Wsh.Readline;
var logger = Wsh.Logger;

var parseDate = util.createDateString;
var includes = util.includes;
var srr = os.surroundPath;
var CSCRIPT = os.exefiles.cscript;
var execFileSync = child_process.execFileSync;
var execSync = child_process.execSync;

var testCmd = srr(CSCRIPT) + ' ' + srr(__filename) + ' //job:test:Logger';

var _cb = function (fn/* , args */) {
  var args = Array.from(arguments).slice(1);
  return function () { fn.apply(null, args); };
};

var _getLogs = function (outputStr) {
  var lines = outputStr.split(/\r?\n/);
  var regLogHeader = new RegExp(
    '^\\[\\d{4}\\-\\d{2}\\-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\] '
  );

  return lines.filter(function (line) {
    return regLogHeader.test(line);
  });
};

describe('Logger', function () {
  var testName;
  var stdOpts = { shell: true, winStyle: 'hidden' };
  var _logObjs = [
    { level: 'error', message: '1 Error message' },
    { level: 'warn', message: '2 Warning message' },
    { level: 'success', message: '3 Success message' },
    { level: 'info', message: '4 Info message' },
    { level: 'debug', message: '5 Debug message' }
  ];

  testName = 'CheckLevels';
  test(testName, function () {
    var lggr;

    lggr = logger.create();
    expect(lggr.outputsLog('error')).toBe(true);
    expect(lggr.outputsLog('warn')).toBe(true);
    expect(lggr.outputsLog('success')).toBe(true);
    expect(lggr.outputsLog('info')).toBe(true);
    expect(lggr.outputsLog('debug')).toBe(false);

    lggr = logger.create('info');
    expect(lggr.outputsLog('error')).toBe(true);
    expect(lggr.outputsLog('warn')).toBe(true);
    expect(lggr.outputsLog('success')).toBe(true);
    expect(lggr.outputsLog('info')).toBe(true);
    expect(lggr.outputsLog('debug')).toBe(false);

    lggr = logger.create('success');
    expect(lggr.outputsLog('error')).toBe(true);
    expect(lggr.outputsLog('warn')).toBe(true);
    expect(lggr.outputsLog('success')).toBe(true);
    expect(lggr.outputsLog('info')).toBe(false);
    expect(lggr.outputsLog('debug')).toBe(false);

    lggr = logger.create('warn');
    expect(lggr.outputsLog('error')).toBe(true);
    expect(lggr.outputsLog('warn')).toBe(true);
    expect(lggr.outputsLog('success')).toBe(false);
    expect(lggr.outputsLog('info')).toBe(false);
    expect(lggr.outputsLog('debug')).toBe(false);

    lggr = logger.create('error');
    expect(lggr.outputsLog('error')).toBe(true);
    expect(lggr.outputsLog('warn')).toBe(false);
    expect(lggr.outputsLog('success')).toBe(false);
    expect(lggr.outputsLog('info')).toBe(false);
    expect(lggr.outputsLog('debug')).toBe(false);

    lggr = logger.create('unknown');
    expect(lggr.outputsLog('error')).toBe(true);
    expect(lggr.outputsLog('warn')).toBe(true);
    expect(lggr.outputsLog('success')).toBe(true);
    expect(lggr.outputsLog('info')).toBe(true);
    expect(lggr.outputsLog('debug')).toBe(true);

    process.env.WSH_ENV = 'development';
    lggr = logger.create('warn');
    expect(lggr.outputsLog('error')).toBe(true);
    expect(lggr.outputsLog('warn')).toBe(true);
    expect(lggr.outputsLog('success')).toBe(false);
    expect(lggr.outputsLog('info')).toBe(false);
    expect(lggr.outputsLog('debug')).toBe(true);
    process.env.WSH_ENV = undefined;
  });

  testName = 'Options_empty_LogFunction';
  test(testName, function () {
    var ARG_SUB_PROCESS1 = '/ARG_SUB_PROCESS1';

    if (includes(process.argv, ARG_SUB_PROCESS1)) {
      var lggr = logger.create(); // empty -> info|console

      _logObjs.forEach(function (logObj) {
        lggr.log(logObj); // Realtime outputing
      });

      lggr.transport();
      process.exit(CD.runs.ok);
    }

    var cmd = testCmd + ' -t "' + testName + '" ' + ARG_SUB_PROCESS1;
    var retObj = execSync(cmd);
    expect(retObj.error).toBe(true);

    var outLogs = _getLogs(retObj.stderr + '\r\n' + retObj.stdout);
    expect(outLogs).toHaveLength(_logObjs.length - 1); // debug excluded

    outLogs.forEach(function (outLog, i) {
      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });

    var errVals = [true, false, 0, 1, NaN, Infinity];
    errVals.forEach(function (val) {
      expect(_cb(logger.create, val)).toThrowError();
    });
  });

  testName = 'Options_empty_method';
  test(testName, function () {
    var ARG_SUB_PROCESS2 = '/ARG_SUB_PROCESS2';

    if (includes(process.argv, ARG_SUB_PROCESS2)) {
      var lggr = logger.create(); // empty -> info|console

      _logObjs.forEach(function (logObj) {
        lggr[logObj.level](logObj.message); // Realtime outputing
      });

      lggr.transport();
      process.exit(CD.runs.ok);
    }

    var cmd = testCmd + ' -t "' + testName + '" ' + ARG_SUB_PROCESS2;
    var retObj = execSync(cmd);
    expect(retObj.error).toBe(true);

    var outLogs = _getLogs(retObj.stderr + '\r\n' + retObj.stdout);
    expect(outLogs).toHaveLength(_logObjs.length - 1); // debug excluded

    outLogs.forEach(function (outLog, i) {
      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });
  });

  testName = 'Options_infoConsole';
  test(testName, function () {
    var ARG_SUB_PROCESS3 = '/ARG_SUB_PROCESS3';

    if (includes(process.argv, ARG_SUB_PROCESS3)) {
      var lggr = logger.create('info/console');

      _logObjs.forEach(function (logObj) {
        lggr[logObj.level](logObj.message); // Realtime outputing
      });

      // lggr.transport();
      process.exit(CD.runs.ok);
    }

    var cmd = testCmd + ' -t "' + testName + '" ' + ARG_SUB_PROCESS3;
    var retObj = execSync(cmd);
    expect(retObj.error).toBe(true);

    var outLogs = _getLogs(retObj.stderr + '\r\n' + retObj.stdout);
    expect(outLogs).toHaveLength(_logObjs.length - 1); // debug excluded

    outLogs.forEach(function (outLog, i) {
      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });
  });

  testName = 'Options_successConsole';
  test(testName, function () {
    var ARG_SUB_PROCESS4 = '/ARG_SUB_PROCESS4';

    if (includes(process.argv, ARG_SUB_PROCESS4)) {
      var lggr = logger.create('success/console');

      _logObjs.forEach(function (logObj) {
        lggr[logObj.level](logObj.message); // Realtime outputing
      });

      lggr.transport();
      process.exit(CD.runs.ok);
    }

    var cmd = testCmd + ' -t "' + testName + '" ' + ARG_SUB_PROCESS4;
    var retObj = execSync(cmd);
    expect(retObj.error).toBe(true);

    var outLogs = _getLogs(retObj.stderr + '\r\n' + retObj.stdout);
    expect(outLogs).toHaveLength(_logObjs.length - 2); // Remove info

    outLogs.forEach(function (outLog, i) {
      expect(includes(outLog, ' info ')).toBe(false);

      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });
  });

  testName = 'Options_warnConsole';
  test(testName, function () {
    var ARG_SUB_PROCESS5 = '/ARG_SUB_PROCESS5';

    if (includes(process.argv, ARG_SUB_PROCESS5)) {
      var lggr = logger.create('warn/console');

      _logObjs.forEach(function (logObj) {
        lggr[logObj.level](logObj.message); // Realtime outputing
      });

      lggr.transport();
      process.exit(CD.runs.ok);
    }

    var cmd = testCmd + ' -t "' + testName + '" ' + ARG_SUB_PROCESS5;
    var retObj = execSync(cmd);
    expect(retObj.error).toBe(true);

    var outLogs = _getLogs(retObj.stderr + '\r\n' + retObj.stdout);
    expect(outLogs).toHaveLength(_logObjs.length - 3); // Remove info, success

    outLogs.forEach(function (outLog, i) {
      expect(includes(outLog, ' info ')).toBe(false);
      expect(includes(outLog, ' success ')).toBe(false);

      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });
  });

  testName = 'Options_errorConsole';
  test(testName, function () {
    var ARG_SUB_PROCESS6 = '/ARG_SUB_PROCESS6';

    if (includes(process.argv, ARG_SUB_PROCESS6)) {
      var lggr = logger.create('error/console');

      _logObjs.forEach(function (logObj) {
        lggr[logObj.level](logObj.message); // Realtime outputing
      });

      lggr.transport();
      process.exit(CD.runs.ok);
    }

    var cmd = testCmd + ' -t "' + testName + '" ' + ARG_SUB_PROCESS6;
    var retObj = execSync(cmd);
    expect(retObj.error).toBe(true);

    var outLogs = _getLogs(retObj.stderr + '\r\n' + retObj.stdout);
    expect(outLogs).toHaveLength(_logObjs.length - 4);

    outLogs.forEach(function (outLog, i) {
      expect(includes(outLog, ' info ')).toBe(false);
      expect(includes(outLog, ' success ')).toBe(false);
      expect(includes(outLog, ' warn ')).toBe(false);

      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });
  });

  testName = 'Options_debugConsole';
  test(testName, function () {
    var ARG_SUB_PROCESS7 = '/ARG_SUB_PROCESS7';

    if (includes(process.argv, ARG_SUB_PROCESS7)) {
      var lggr = logger.create('info/console');

      process.env.WSH_ENV = 'development';
      _logObjs.forEach(function (logObj) {
        lggr[logObj.level](logObj.message); // Realtime outputing
      });

      lggr.transport();
      process.exit(CD.runs.ok);
    }

    var cmd = testCmd + ' -t "' + testName + '" ' + ARG_SUB_PROCESS7;
    var retObj = execSync(cmd);
    expect(retObj.error).toBe(true);

    var outLogs = _getLogs(retObj.stderr + '\r\n' + retObj.stdout);
    expect(outLogs).toHaveLength(_logObjs.length);

    outLogs.forEach(function (outLog, i) {
      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });
  });

  testName = 'Options_warnFilename';
  test(testName, function () {
    var logFileName = 'logger-test_option-file.log';
    var lggr = logger.create('warn/' + logFileName);

    var logPath = path.join(process.cwd(), logFileName);
    expect(lggr.logPath).toBe(logPath);

    fse.removeSync(logPath);
    expect(fs.existsSync(logPath)).toBe(false);

    _logObjs.forEach(function (logObj) {
      lggr[logObj.level](logObj.message);
    });

    lggr.transport(); // Write the log file

    expect(fs.existsSync(logPath)).toBe(true);
    var logStr = fs.readFileSync(logPath, { encoding: 'utf8' });

    var outLogs = _getLogs(logStr);
    expect(outLogs).toHaveLength(_logObjs.length - 3); // Remove info, success

    outLogs.forEach(function (outLog, i) {
      expect(includes(outLog, ' info ')).toBe(false);
      expect(includes(outLog, ' success ')).toBe(false);

      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });

    // Cleans
    fse.removeSync(logPath);
    expect(fs.existsSync(logPath)).toBe(false);
  });

  testName = 'GoesThroughAnyFunction';
  test(testName, function () {
    var func1 = function (lggr) {
      var lgr = logger.create(lggr);

      _logObjs.forEach(function (logObj) {
        lgr[logObj.level](logObj.message); // error -> +1 log
      });
    };

    var func2 = function (lggr) {
      var lgr = logger.create({ level: 'warn', transportation: lggr });

      _logObjs.forEach(function (logObj) {
        lgr[logObj.level](logObj.message); // warn -> +2 log
      });
    };

    var func3 = function (lggr) {
      var lgr = logger.create({ transportation: lggr });

      _logObjs.forEach(function (logObj) {
        lgr[logObj.level](logObj.message); // warn -> +2 log
      });
    };

    var logPath = os.makeTmpPath('logger-test_any-funcs_', '.log');
    var lggr = logger.create('error/' + logPath);

    fse.removeSync(logPath);
    expect(fs.existsSync(logPath)).toBe(false);

    func1(lggr);
    func2(lggr);
    func3(lggr);

    lggr.setLevel('success'); // Change the log level

    _logObjs.forEach(function (logObj) {
      lggr[logObj.level](logObj.message); // success -> +3 log
    });

    lggr.transport();

    expect(fs.existsSync(logPath)).toBe(true);

    var logStr = fs.readFileSync(logPath, { encoding: 'utf8' });
    var outLogs = _getLogs(logStr);
    expect(outLogs).toHaveLength(8);
    expect(/\s+error\s+/.test(outLogs[0])).toBe(true);
    expect(/\s+error\s+/.test(outLogs[1])).toBe(true);
    expect(/\s+warn\s+/.test(outLogs[2])).toBe(true);
    expect(/\s+error\s+/.test(outLogs[3])).toBe(true);
    expect(/\s+warn\s+/.test(outLogs[4])).toBe(true);
    expect(/\s+error\s+/.test(outLogs[5])).toBe(true);
    expect(/\s+warn\s+/.test(outLogs[6])).toBe(true);
    expect(/\s+success\s+/.test(outLogs[7])).toBe(true);

    // Cleans
    fse.removeSync(logPath);
    expect(fs.existsSync(logPath)).toBe(false);
  });

  testName = 'Options_errorDatecode';
  test(testName, function () {
    var yyyy = parseDate('yyyy');
    var MM = parseDate('MM');
    var dd = parseDate('dd');

    var logFileNameCode = 'logger-test_#{yyyy-MM-dd}.log';
    var logFileName = 'logger-test_' + yyyy + '-' + MM + '-' + dd + '.log';

    var lggr = logger.create('error/' + logFileNameCode);

    var logPath = path.join(process.cwd(), logFileName);
    expect(lggr.logPath).toBe(logPath);

    fse.removeSync(logPath);
    expect(fs.existsSync(logPath)).toBe(false);

    _logObjs.forEach(function (logObj) {
      lggr[logObj.level](logObj.message);
    });

    lggr.transport(); // Write the log file

    expect(fs.existsSync(logPath)).toBe(true);
    var logStr = fs.readFileSync(logPath, { encoding: 'utf8' });
    var outLogs = _getLogs(logStr);
    expect(outLogs).toHaveLength(_logObjs.length - 4);

    outLogs.forEach(function (outLog, i) {
      expect(includes(outLog, ' info ')).toBe(false);
      expect(includes(outLog, ' success ')).toBe(false);
      expect(includes(outLog, ' warn ')).toBe(false);

      var reg = new RegExp(_logObjs[i].level + '\\s+' + _logObjs[i].message + '$');
      expect(reg.test(outLog)).toBe(true);
    });

    // Cleans
    fse.removeSync(logPath);
    expect(fs.existsSync(logPath)).toBe(false);
  });

  testName = 'Clears_onConsole';
  test(testName, function () {
    var ARG_SUB_PROCESS8 = '/ARG_SUB_PROCESS8';

    if (includes(process.argv, ARG_SUB_PROCESS8)) {
      var lggr = logger.create('success/console');

      _logObjs.forEach(function (logObj) {
        lggr[logObj.level](logObj.message); // Realtime outputing
      });

      lggr.clear(); // Clear, but it's meaningless
      lggr.transport(); // Empty
      process.exit(CD.runs.ok);
    }

    var cmd = testCmd + ' -t "' + testName + '" ' + ARG_SUB_PROCESS8;
    var retObj = execSync(cmd);
    expect(retObj.error).toBe(true);

    var outLogs = _getLogs(retObj.stderr + '\r\n' + retObj.stdout);
    expect(outLogs).toHaveLength(_logObjs.length - 2);
  });

  testName = 'Clears_infoFilename';
  test(testName, function () {
    var logFileName = 'logger-test_option-file_clear.log';
    var lggr = logger.create('info/' + logFileName);

    var logPath = path.join(process.cwd(), logFileName);
    expect(lggr.logPath).toBe(logPath);

    fse.removeSync(logPath);
    expect(fs.existsSync(logPath)).toBe(false);

    _logObjs.forEach(function (logObj) {
      lggr[logObj.level](logObj.message);
    });

    lggr.clear(); // Clear, but it's meaningless
    lggr.transport(); // Not write. because logs is empty

    expect(fs.existsSync(logPath)).toBe(false);
  });

  testName = 'Options_infoPopup';
  test(testName, function () {
    var lggr = logger.create('info/popup');

    _logObjs.forEach(function (logObj) {
      lggr[logObj.level](logObj.message);
    });

    lggr.transport();

    var ans = rl.questionSync('Did the log appear in the window?/y or Not');
    expect(ans.toUpperCase()).toBe('Y');
  });

  testName = 'Options_warnWinEvent';
  test(testName, function () {
    var lggr = logger.create('warn/winEvent');

    _logObjs.forEach(function (logObj) {
      lggr[logObj.level](logObj.message);
    });

    lggr.transport();

    var ans = rl.questionSync('Check Windows Event Viewer. Was the log written in it?/y or Not');
    expect(ans.toUpperCase()).toBe('Y');
  });
});
