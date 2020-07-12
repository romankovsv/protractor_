


export class Logger{

    /* static log():any{
        return logger;
    }
*/
    static logs(text:string){
        const log4js = require('log4js');
        log4js.configure('log4js.json')
        const logger = log4js.getLogger();
        logger.level = 'debug';
        logger.debug("\n"+text);
    }
}
