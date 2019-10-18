"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js = require('log4js');
log4js.configure('../src/helpers/log4js.json');
const logger = log4js.getLogger();
logger.level = 'debug';
class Log {
    static log() {
        return logger;
    }
}
exports.Log = Log;
//# sourceMappingURL=Log.js.map