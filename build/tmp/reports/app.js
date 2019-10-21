var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {
    "showTotalDurationIn": "header",
    "totalDurationFormat": "hms"
};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "32c8578bf4f8d186e6ce62f96600047f",
        "instanceId": 18356,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571656667073,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571656667073,
                "type": ""
            }
        ],
        "timestamp": 1571656641309,
        "duration": 44798
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "b83b19dabc7ad7a224f875077099324f",
        "instanceId": 20464,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Element By(css selector, .vendor-contract--footer button[kind='primaryRaised']) is not visible\nWait timed out after 10015ms"
        ],
        "trace": [
            "TimeoutError: Element By(css selector, .vendor-contract--footer button[kind='primaryRaised']) is not visible\nWait timed out after 10015ms\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\promise.js:2201:17\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:24:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571656956674,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571656956674,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00ae003f-007c-007d-003d-00e6002f0005.png",
        "timestamp": 1571656932062,
        "duration": 52128
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "71fe9f6fed48f1ead065a132f96dcbc3",
        "instanceId": 10536,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571658216782,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571658216782,
                "type": ""
            }
        ],
        "timestamp": 1571658190556,
        "duration": 39319
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "3ecba4ee5622cb93416646cdd097abf4",
        "instanceId": 26260,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Cannot set property 'country' of undefined"
        ],
        "trace": [
            "TypeError: Cannot set property 'country' of undefined\n    at new AddressDataBuilder (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\models\\AddressDataBuilder.ts:8:33)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:59:39)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:4:12)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:31:16)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:112:25\n    at new Promise (<anonymous>)\n    at SimpleScheduler.promise (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\promise.js:2242:12)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00cc0044-00c7-00c2-0067-009300e80031.png",
        "timestamp": 1571664431260,
        "duration": 1959
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "46d8221e16cc53f6585498edd30bd4cc",
        "instanceId": 7332,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664625766,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664625767,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664625862,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664625862,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664625963,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664625964,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664626067,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664626067,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://clients6.google.com/voice/v1/users/@me/account?checkHangoutsCallingPermission=false&key=AIzaSyD7InnYR3VKdb4j2rMUEbTCIr2VyEazl6k&locale=ru&alt=protojson - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1571664634700,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/webchat/u/0/frame2?v=1570742393&pvt=AMP3uWYfa-bQvY04XiiNc6DXjMQQoQDJm2xK9EBP2ktsfcERtkhVsY2JuFQwY4jMyFnLYbDD_tat-yhZby8OQ-tBrprfIN-z9Q%3D%3D&prop=gmail&hl=ru&fid=gtn-roster-iframe-id#e%5B%22wblh0.488688144360685-0%22,2,1,%5Btrue,%5B%5D%5D%5D - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1571664634775,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://chat-pa.clients6.google.com/chat/v1/conversations/syncrecentconversations?key=AIzaSyD7InnYR3VKdb4j2rMUEbTCIr2VyEazl6k&reqId=cs1246343427183&alt=protojson - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1571664634855,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://chat-pa.clients6.google.com/chat/v1/presence/querypresence?key=AIzaSyD7InnYR3VKdb4j2rMUEbTCIr2VyEazl6k&alt=protojson - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1571664634939,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/webchat/u/0/frame2?v=1570742393&pvt=AMP3uWYfa-bQvY04XiiNc6DXjMQQoQDJm2xK9EBP2ktsfcERtkhVsY2JuFQwY4jMyFnLYbDD_tat-yhZby8OQ-tBrprfIN-z9Q%3D%3D&prop=gmail&hl=ru&fid=gtn-roster-iframe-id#e%5B%22wblh0.488688144360685-1%22,2,1,%5Bnull,%5B2,3,4,5%5D%5D%5D - Failed to load resource: the server responded with a status of 400 ()",
                "timestamp": 1571664634977,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635000,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635000,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635118,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635118,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635228,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635228,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635367,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635367,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635490,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635490,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635571,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664635571,
                "type": ""
            }
        ],
        "timestamp": 1571664562339,
        "duration": 72437
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "44cce29f0f5983712da420fb7fef241e",
        "instanceId": 3836,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664671785,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664671785,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664671880,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571664671880,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571664688658,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571664688674,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\007a0099-0052-0083-00fe-000e002000c9.png",
        "timestamp": 1571664645550,
        "duration": 62301
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "5fe14546f9f2011eb2c089fafa42ea5c",
        "instanceId": 26432,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Element By(css selector, .vendor-contract--footer button[kind='primaryRaised']) is not clickable"
        ],
        "trace": [
            "TimeoutError: Element By(css selector, .vendor-contract--footer button[kind='primaryRaised']) is not clickable\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\promise.js:2201:17\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.qa.metro-vendorcentral.com/dashboard - Failed to decode downloaded font: https://fonts.gstatic.com/stats/Source+Sans+Pro/normal/400",
                "timestamp": 1571665889779,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.qa.metro-vendorcentral.com/profiles/ - Failed to decode downloaded font: https://fonts.gstatic.com/stats/Source+Sans+Pro/normal/400",
                "timestamp": 1571665890708,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.qa.metro-vendorcentral.com/profiles/ - Failed to decode downloaded font: https://fonts.gstatic.com/stats/Source+Sans+Pro/normal/400",
                "timestamp": 1571665893430,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571665902182,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571665902182,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\0050007a-0089-0036-00d8-001500ec00dd.png",
        "timestamp": 1571665874951,
        "duration": 55305
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "2dc016c1ebf66898bab0b200a44a2bef",
        "instanceId": 19000,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571665983512,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571665983512,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571665983607,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571665983607,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666004226,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666004238,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00800009-0066-00ce-0037-00c80011007e.png",
        "timestamp": 1571665957265,
        "duration": 61910
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bad08eb279b1555ef63ac3caeb54fe0",
        "instanceId": 1612,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666077654,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666077654,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666077749,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666077749,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666093827,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666093835,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00fd00f1-0002-007a-003f-004300e6001c.png",
        "timestamp": 1571666050681,
        "duration": 62108
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "71ae9fc8471a2735fa03f1da8f6a5685",
        "instanceId": 12972,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : ../../resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : ../../resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:37:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666218652,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666218652,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666238832,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666238839,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00280023-006d-00c1-00e0-00a900b40073.png",
        "timestamp": 1571666193152,
        "duration": 46255
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "4d16da7f362c825721cd7b96dfdfaa4a",
        "instanceId": 17916,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:37:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.7kWSr24wXFc.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo-i9r7IbCTUQfJ0v-FPhRKRS8aihQ/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571666289815,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.7kWSr24wXFc.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo-i9r7IbCTUQfJ0v-FPhRKRS8aihQ/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571666289815,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.7kWSr24wXFc.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo-i9r7IbCTUQfJ0v-FPhRKRS8aihQ/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571666289816,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.7kWSr24wXFc.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo-i9r7IbCTUQfJ0v-FPhRKRS8aihQ/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571666289816,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666291768,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666291768,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666291863,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666291863,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666309910,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666309917,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\001100a2-0048-0051-007e-006800bb005a.png",
        "timestamp": 1571666264466,
        "duration": 46024
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "faeb234e22cb3b8f7d15c43415f32f17",
        "instanceId": 17348,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:37:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666357725,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666357725,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666372406,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666372416,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\001200d2-0097-00d1-001a-00f700c30084.png",
        "timestamp": 1571666331735,
        "duration": 41254
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "161f7958fe3d4797c5083cedfa5aaefd",
        "instanceId": 25000,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:37:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666629758,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571666629758,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666651504,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571666651511,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\0072001e-00d3-0067-00da-000c00f30017.png",
        "timestamp": 1571666603741,
        "duration": 48346
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "d82b916d4a76f5cba98ab2eb2c955d07",
        "instanceId": 13172,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:37:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667036839,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667036840,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667054669,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667054678,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\007700fc-001b-002f-00c1-000b00390044.png",
        "timestamp": 1571667011151,
        "duration": 44128
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "9662b95e2d7c974ab7cddc31d6d1b4b0",
        "instanceId": 20288,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:37:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667131282,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667131282,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667131374,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667131374,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667149967,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667149974,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\006a00a6-0025-00e1-002b-00f9003f0089.png",
        "timestamp": 1571667103740,
        "duration": 46774
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "75a4f3539a934c75b9adc64f76ed7ca5",
        "instanceId": 9980,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.qa.metro-vendorcentral.com/profiles/ - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1571667340935,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.qa.metro-vendorcentral.com/favicon.ico - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1571667340935,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667349297,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667349297,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667349389,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667349389,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667362722,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667362728,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\005f004a-007e-00fa-00b5-00cd00300022.png",
        "timestamp": 1571667323492,
        "duration": 39816
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "f532c2a4ae8e9fadc2d7e1a3b53b46e4",
        "instanceId": 19916,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : ../../../src/resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : ../../../src/resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667430902,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667430902,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667430998,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667430998,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667431178,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667431178,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667431284,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667431284,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667446773,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667446780,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00c100b1-00f5-0044-003f-008200590008.png",
        "timestamp": 1571667403890,
        "duration": 43450
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "cd44f1cf93ab06e7885d3caff34991e1",
        "instanceId": 4988,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667776793,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667776793,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667776887,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667776887,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667776988,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667776988,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667777091,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667777091,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667777192,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571667777192,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667794414,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571667794421,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00bb0038-0025-0045-0071-000300ed0004.png",
        "timestamp": 1571667749845,
        "duration": 45170
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "62f58f46fb24cbbe01a6e1aca479a4ec",
        "instanceId": 11900,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668110316,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668110317,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668110414,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668110414,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668110514,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668110514,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668126248,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668126256,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\0019003a-00e4-00fc-0030-0076002e0033.png",
        "timestamp": 1571668082745,
        "duration": 44047
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "0348b9a0953df6783f55ee296c25da18",
        "instanceId": 22952,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668235164,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668235164,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668255540,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668255547,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00c700d4-006c-0079-0006-00e200040031.png",
        "timestamp": 1571668207830,
        "duration": 48293
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "f7a3dfff4e8769842599470e65ae5f71",
        "instanceId": 25916,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\resources.contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668354378,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668354378,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668370242,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668370248,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\007a0020-00d2-007f-00e1-00f1007a0053.png",
        "timestamp": 1571668329072,
        "duration": 41804
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "d62cd349bf540577656231f49960c1c2",
        "instanceId": 25548,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\resources\\contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\resources\\contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668437482,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668437482,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668437578,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668437578,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668454354,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668454361,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00be00ad-0097-008e-00cd-00ec00370020.png",
        "timestamp": 1571668411590,
        "duration": 43336
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ca3b5ad192e277bf4cf85f5a4830c46b",
        "instanceId": 25440,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\resources\\contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\resources\\contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668503599,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668503599,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668503694,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668503694,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668519458,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668519465,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00d4000f-0072-00a4-008d-00520032004b.png",
        "timestamp": 1571668478763,
        "duration": 41261
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "29cfb5f98678be8d157960051d7cf019",
        "instanceId": 21692,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\resources\\contract.pdf\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: File not found : C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\resources\\contract.pdf\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at RegistrationNumberFieldsPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.ts:38:47)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\RegistrationNumberFieldsPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:36:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:28:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668607351,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668607351,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668607445,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571668607445,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668623731,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:1430858 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1571668623738,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00d10062-00aa-003a-0035-001e00e80077.png",
        "timestamp": 1571668582027,
        "duration": 42274
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8a5c39f094ec7ff8e5568cb47f98381e",
        "instanceId": 16920,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571669415794,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571669415794,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571669415893,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571669415893,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00a60065-00dd-0032-005c-000200760031.png",
        "timestamp": 1571669386987,
        "duration": 63982
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "cf3a9b1b510219df90e12ce9b9041092",
        "instanceId": 26592,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571670767703,
                "type": ""
            }
        ],
        "timestamp": 1571670765427,
        "duration": 3268
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "243d3e7ee57a3a2807d08e593c2fa96e",
        "instanceId": 25660,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:17:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00600079-00eb-003f-00aa-00ca00e90010.png",
        "timestamp": 1571670986444,
        "duration": 1388
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "c2b640f1698e144c9267be83a04f3415",
        "instanceId": 18048,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:17:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571671672153,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\0043006b-001e-00e0-0083-00bc003c00b3.png",
        "timestamp": 1571671670307,
        "duration": 1548
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "d206f58cf3ce42cd8194ea7de596b85c",
        "instanceId": 18892,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:17:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571672242778,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00050093-00be-0077-0093-00eb003400c9.png",
        "timestamp": 1571672191163,
        "duration": 50481
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "c4739730d19adede710970727021a890",
        "instanceId": 11220,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:17:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571672320125,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00ed00cf-0014-00f4-004f-004c004800f2.png",
        "timestamp": 1571672318490,
        "duration": 1332
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "872812600a2e940e2d6aa10ec9dc986d",
        "instanceId": 26488,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:18:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00e10075-0084-00c6-0060-0016005d0062.png",
        "timestamp": 1571672613571,
        "duration": 1371
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "01502d18c97fac52496a5855b025b13a",
        "instanceId": 4600,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:18:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571672740963,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00b000ff-0025-0077-0009-004b001800c8.png",
        "timestamp": 1571672664377,
        "duration": 76574
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ad08070895dc4f9eff36c03857e32e65",
        "instanceId": 13924,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:18:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571672780994,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00760009-0049-001a-0073-00cc0095007f.png",
        "timestamp": 1571672755625,
        "duration": 25350
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "57d6d0f35219f5437801366837f61dfe",
        "instanceId": 12100,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:18:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\000f002f-00ed-0079-009b-00fd00580060.png",
        "timestamp": 1571672877220,
        "duration": 2081
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "7500065941995ac474a5f25f7207e301",
        "instanceId": 14760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:18:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\008a00fb-0008-0042-009a-00db00f400a1.png",
        "timestamp": 1571673290727,
        "duration": 1666
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "413003d936d31bcdece3e3cfdc4039b1",
        "instanceId": 13088,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: Cannot read property 'forEach' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'forEach' of undefined\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:18:26)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\0007009b-00d1-00eb-00a8-006200640090.png",
        "timestamp": 1571673809259,
        "duration": 1320
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "55c00f0631646306c0eed28e423395a1",
        "instanceId": 24892,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571674586122,
                "type": ""
            }
        ],
        "timestamp": 1571674583865,
        "duration": 3282
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "25955620a6a06f15e48aef795d45e551",
        "instanceId": 23364,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571674785951,
                "type": ""
            }
        ],
        "timestamp": 1571674784331,
        "duration": 2656
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "7e860117a87fa5378160e395bb5f9c28",
        "instanceId": 23272,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571674876064,
                "type": ""
            }
        ],
        "timestamp": 1571674831123,
        "duration": 55760
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "065ffadebf756e002785f3c3c6d9d045",
        "instanceId": 13060,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571675228843,
                "type": ""
            }
        ],
        "timestamp": 1571675227215,
        "duration": 2679
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "c673aa1ec3cfcf44777d8d77022e9805",
        "instanceId": 16592,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571675296370,
                "type": ""
            }
        ],
        "timestamp": 1571675294770,
        "duration": 2634
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "2b0b31e7c7dbcbd840320ce8b6568267",
        "instanceId": 22156,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "WebDriverError: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:48:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\000500ea-00fd-0034-0025-00a700520078.png",
        "timestamp": 1571675915192,
        "duration": 182
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "2c6dc08441b9398384c0185745ff0d38",
        "instanceId": 13832,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "WebDriverError: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:48:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00c4003b-000d-00c1-00fc-000f002b0023.png",
        "timestamp": 1571675939026,
        "duration": 175
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "518e331ce7baa548ee0fa5d5826c6c29",
        "instanceId": 17392,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "WebDriverError: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:48:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\005700b3-0072-00db-003f-00be004900d5.png",
        "timestamp": 1571675986610,
        "duration": 179
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "76be0d04b84b14248a43e043c71d8837",
        "instanceId": 1620,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "WebDriverError: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:48:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00630018-0047-003c-005d-00ff004a0087.png",
        "timestamp": 1571676112041,
        "duration": 171
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a474aaa47e2480a120ac1fdb92ec27d",
        "instanceId": 26740,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571676155734,
                "type": ""
            }
        ],
        "timestamp": 1571676153619,
        "duration": 3208
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6d2f4a8301bc33411a75fe2693352a9c",
        "instanceId": 24404,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571676752041,
                "type": ""
            }
        ],
        "timestamp": 1571676750430,
        "duration": 2724
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "abf4943e85534b932506573816d8da3e",
        "instanceId": 16592,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571676770111,
                "type": ""
            }
        ],
        "timestamp": 1571676768478,
        "duration": 2643
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
