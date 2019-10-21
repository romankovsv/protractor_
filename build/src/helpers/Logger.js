"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js = require('log4js');
log4js.configure('../src/helpers/log4js.json');
const logger = log4js.getLogger();
logger.level = 'debug';
class Logger {
    static log() {
        return logger;
    }
    static logs(text) {
        logger.debug("\n" + text);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map