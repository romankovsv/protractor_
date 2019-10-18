
const log4js = require('log4js');
log4js.configure('../src/helpers/log4js.json')
const logger = log4js.getLogger();
logger.level = 'debug';

export class Log{
     static log():any{
        return logger;
    }
}