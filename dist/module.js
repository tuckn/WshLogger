﻿!function(){var sh,util,CD,path,os,fs,fse,insp,obtain,isPlainObject,isSolidString,hasIn,hasContent,parseDate,parseDateLiteral,logger,MODULE_TITLE,lvPriority;function _parseLogsToStr(logs,options){for(var log,eolChar=hasIn(options,"eolChar")?options.eolChar:os.EOL,logStr="",lvDisp={debug:"debug   ",info:"info    ",success:"success ",warn:"warn    ",error:"error   "},i=0,I=logs.length;i<I;i++)logStr+="["+(log=logs[i]).timestamp+"]",logStr+=" "+lvDisp[isSolidString(log.level)?log.level:"info"]+log.message+eolChar;return logStr}function _createLogObj(level,message){return{timestamp:parseDate("yyyy-MM-ddTHH:mm:ss"),level:level,message:message}}function _Logger(params){this.level=obtain(params,"level","info").toLowerCase();var dest=obtain(params,"transportation","console");/^none$/i.test(dest)?this.transportation="NONE":/^console$/i.test(dest)?this.transportation="CONSOLE":/^popup$/i.test(dest)?this.transportation="POPUP":/^winevent$/i.test(dest)?this.transportation="WINEVENT":(this.transportation="FILE",dest=path.resolve(dest),this.logPath=parseDateLiteral(dest),fs.existsSync(this.logPath)&&fs.statSync(this.logPath).isDirectory()&&(this.logPath=path.join(this.logPath,parseDate()+".log"))),this.encoding=obtain(params,"encoding",CD.ado.charset.utf8),this.logs=[],this.stackingLogs=[],this.logLevelResult="info",this.clear=function(){this.logs=[],this.logLevelResult="info"},this.setLevel=function(level){this.level=level.toLowerCase()},this.stackLog=function(obj){var level=obtain(obj,"level",null).toLowerCase();this.outputsLog(level)&&this.stackingLogs.push(_createLogObj(level,obj.message))},this.clearStackingLogs=function(){this.stackingLogs=[]},this.outputsLog=function(level){return isSolidString(level)||function(functionName,typeErrVal){util.throwTypeError("string",MODULE_TITLE,functionName,typeErrVal)}("outputsLog",level),lvPriority[this.logLevelResult]>lvPriority[level]&&(this.logLevelResult=level),"off"!==level&&("debug"===level&&"development"===process.env.WSH_ENV||!(lvPriority[this.level]<lvPriority[level]))},this.log=function(obj){var message,parsedLog,level=obtain(obj,"level",null).toLowerCase();this.outputsLog(level)&&(0<this.stackingLogs.length&&(this.logs=this.logs.concat(this.stackingLogs),this.clearStackingLogs()),message=obtain(obj,"message",""),this.logs.push(_createLogObj(level,message)),"CONSOLE"===this.transportation&&(parsedLog=_parseLogsToStr(this.logs,{eolChar:""}),"error"===level?console.error(parsedLog):console.log(parsedLog),this.clear()))},this.debug=function(message){this.log({level:"debug",message:message})},this.info=function(message){this.log({level:"info",message:message})},this.success=function(message){this.log({level:"success",message:message})},this.warn=function(message){this.log({level:"warn",message:message})},this.error=function(message){this.log({level:"error",message:message})},this.transport=function(){if(null!==this.transportation&&"NONE"!==this.transportation){var logStr="";if("FILE"===this.transportation)try{logStr=fs.readFileSync(this.logPath,{encoding:this.encoding})}catch(e){var errStr=insp(e);if(!/no such file or directory/i.test(errStr))throw e;logStr=""}if(""==(logStr+=_parseLogsToStr(this.logs)))return this.clear();if("CONSOLE"===this.transportation)console.log(logStr);else if("POPUP"===this.transportation){var ico=/^error$/i.test(this.logLevelResult)?CD.iconTypes.stop:/^warn$/i.test(this.logLevelResult)?CD.iconTypes.excl:CD.iconTypes.infomaiton;sh.Popup(logStr,CD.nonAutoClosing,MODULE_TITLE,CD.buttonTypes.ok+ico)}else if("WINEVENT"===this.transportation)os.writeLogEvent[this.logLevelResult](logStr);else if("FILE"===this.transportation)try{fse.ensureDirSync(path.dirname(this.logPath)),fs.writeFileSync(this.logPath,logStr,{encoding:this.encoding})}catch(e){throw new Error(insp(e)+"\n  at transport ("+MODULE_TITLE+')\n  Failed to write the log "'+this.logPath+'"')}this.clear()}}}Wsh&&Wsh.Logger||(Wsh.Logger={},sh=Wsh.Shell,util=Wsh.Util,CD=Wsh.Constants,path=Wsh.Path,os=Wsh.OS,fs=Wsh.FileSystem,fse=Wsh.FileSystemExtra,insp=util.inspect,obtain=util.obtainPropVal,isPlainObject=util.isPlainObject,isSolidString=util.isSolidString,hasIn=util.hasIn,hasContent=util.hasContent,parseDate=util.createDateString,parseDateLiteral=util.parseDateLiteral,logger=Wsh.Logger,MODULE_TITLE="WshLogger/Logger.js",lvPriority={off:0,error:1,warn:2,success:3,info:4,debug:5},logger.create=function(options){var level,transportation,encoding;if(options instanceof _Logger)return options;if(isSolidString(options)){var args=options.split("/");return 1<args.length?(level=args[0],transportation=args[1]):level=args[0],new _Logger({level:level,transportation:transportation})}if(isPlainObject(options))return level=obtain(options,"level",null),transportation=obtain(options,"transportation",null),encoding=obtain(options,"encoding",CD.ado.charset.utf8),transportation instanceof _Logger?(isSolidString(level)&&transportation.setLevel(level),transportation):new _Logger({level:level,transportation:transportation,encoding:encoding});if(!hasContent(options))return new _Logger({level:null,transportation:null,encoding:null});throw new Error("Error [ERR_INVALID_ARG_TYPE]\n  at logger.create ("+MODULE_TITLE+")\n  options: "+insp(options))})}();
