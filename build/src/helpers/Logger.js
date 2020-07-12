"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    /* static log():any{
        return logger;
    }
*/
    static logs(text) {
        const log4js = require('log4js');
        log4js.configure('log4js.json');
        const logger = log4js.getLogger();
        logger.level = 'debug';
        logger.debug("\n" + text);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map