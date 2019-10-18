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
        "description": "should find the add contact button|adding a new contact with only a name",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396367791,
        "duration": 2864
    },
    {
        "description": "should type in an email address|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396370743,
        "duration": 2835
    },
    {
        "description": "should type in a phone number|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396373593,
        "duration": 3021
    },
    {
        "description": "should load a page and verify the url|your first protractor test",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396376633,
        "duration": 1573
    },
    {
        "description": "should click the + button|create new contact",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396378223,
        "duration": 2464
    },
    {
        "description": "should fill out form for a new contact|create new contact",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to be '1'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\CreateNewContactSpec.ts:32:45\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\CreateNewContactSpec.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00e600c4-0068-0042-0055-007300e9009c.png",
        "timestamp": 1571396380699,
        "duration": 2768
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571396386043,
                "type": ""
            }
        ],
        "timestamp": 1571396383832,
        "duration": 3170
    },
    {
        "description": "shouldn’t create a new contact with baduser.com|adding a new contact with an invalid email",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396387017,
        "duration": 2679
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "79fc0ac1ce4e7a1b3d577ba7e860c0f0",
        "instanceId": 760,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571396395680,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571396396612,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571396396613,
                "type": ""
            }
        ],
        "timestamp": 1571396389715,
        "duration": 8496
    },
    {
        "description": "should find the add contact button|adding a new contact with only a name",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396409449,
        "duration": 2909
    },
    {
        "description": "should type in an email address|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396412442,
        "duration": 2634
    },
    {
        "description": "should type in a phone number|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396415092,
        "duration": 2487
    },
    {
        "description": "should load a page and verify the url|your first protractor test",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396417594,
        "duration": 1410
    },
    {
        "description": "should click the + button|create new contact",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396419020,
        "duration": 2340
    },
    {
        "description": "should fill out form for a new contact|create new contact",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to be '1'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\CreateNewContactSpec.ts:32:45\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\CreateNewContactSpec.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00cc00a4-0004-0054-0002-00aa00ed00a2.png",
        "timestamp": 1571396421374,
        "duration": 2807
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571396425958,
                "type": ""
            }
        ],
        "timestamp": 1571396424572,
        "duration": 2416
    },
    {
        "description": "shouldn’t create a new contact with baduser.com|adding a new contact with an invalid email",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396427003,
        "duration": 2638
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dc4ab84b72ba32ae50bcee90903e9b02",
        "instanceId": 8080,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571396435642,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571396436537,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571396436537,
                "type": ""
            }
        ],
        "timestamp": 1571396429720,
        "duration": 8541
    },
    {
        "description": "should find the add contact button|adding a new contact with only a name",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396456467,
        "duration": 2919
    },
    {
        "description": "should type in an email address|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396459480,
        "duration": 2580
    },
    {
        "description": "should type in a phone number|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396462075,
        "duration": 2455
    },
    {
        "description": "should load a page and verify the url|your first protractor test",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396464545,
        "duration": 1408
    },
    {
        "description": "should click the + button|create new contact",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396465974,
        "duration": 2395
    },
    {
        "description": "should fill out form for a new contact|create new contact",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to be '1'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\CreateNewContactSpec.ts:32:45\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\CreateNewContactSpec.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00bb0067-0042-0086-008e-00b8002400ae.png",
        "timestamp": 1571396468383,
        "duration": 2794
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571396473013,
                "type": ""
            }
        ],
        "timestamp": 1571396471538,
        "duration": 2439
    },
    {
        "description": "shouldn’t create a new contact with baduser.com|adding a new contact with an invalid email",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396473993,
        "duration": 2585
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a7040b03ca672727c2bb3aba6df15808",
        "instanceId": 14228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571396477541,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571396478753,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571396478754,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://api-analytics.rozetka.com.ua/js/exponea.min.js 29:258 \"Exponea [Fri, 18 Oct 2019 11:01:20 GMT] Missing Google Analytics SDK (window.ga is not defined). Either integrate Google Analytics with your website or disable Google Analytics integration in the SDK config:\\nhttps://docs.exponea.com/docs/config-object\"",
                "timestamp": 1571396480229,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/pages/136/136461.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480368,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/136/136928.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480369,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/146/146693.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480369,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/137/137033.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480369,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/pages/137/137012.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480370,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_articles/138/138289.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480376,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_articles/138/138282.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480376,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_articles/138/138275.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480376,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_news/83/83711.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480376,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_news/74/74952.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480376,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_news/74/74572.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571396480377,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple - Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/136/136482.png'. This content should also be served over HTTPS.",
                "timestamp": 1571396480403,
                "type": ""
            }
        ],
        "timestamp": 1571396476594,
        "duration": 5319
    },
    {
        "description": "should find the add contact button|adding a new contact with only a name",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396924032,
        "duration": 19875
    },
    {
        "description": "should type in an email address|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396944073,
        "duration": 2761
    },
    {
        "description": "should type in a phone number|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396946850,
        "duration": 2441
    },
    {
        "description": "should load a page and verify the url|your first protractor test",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396949307,
        "duration": 1463
    },
    {
        "description": "should click the + button|create new contact",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396950786,
        "duration": 2342
    },
    {
        "description": "should fill out form for a new contact|create new contact",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to be '1'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\CreateNewContactSpec.ts:32:45\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\CreateNewContactSpec.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\004d00e9-00d8-00f9-009a-003b002d0078.png",
        "timestamp": 1571396953144,
        "duration": 2800
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571396964276,
                "type": ""
            }
        ],
        "timestamp": 1571396956331,
        "duration": 8940
    },
    {
        "description": "shouldn’t create a new contact with baduser.com|adding a new contact with an invalid email",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571396965289,
        "duration": 2662
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8fb3550d0fa5dd948e8c541bdaf457cd",
        "instanceId": 26056,
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
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571396981267,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571397026677,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571397026678,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\007400ed-0060-005c-00b6-00c600940082.png",
        "timestamp": 1571396967969,
        "duration": 59053
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "57a550a1fb95d2952e5dbc93ca027a76",
        "instanceId": 13072,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Angular could not be found on the page https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:720:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:11:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\003f005e-0060-009a-00d0-00b40022002f.png",
        "timestamp": 1571397919301,
        "duration": 13537
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "14c9361717b009509df43f162f615206",
        "instanceId": 16840,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1571398725840,
        "duration": 1197
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "acc2dc29bd5331c883582e1e9f1a76b8",
        "instanceId": 10568,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Cannot read property 'debug' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'debug' of undefined\n    at Element.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\Element.ts:31:24)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\Element.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\Element.js:4:12)\n    at Element.customSendKeys (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\Element.js:35:16)\n    at VendorCentralLoginPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\VendorCentralLoginPage.ts:31:31)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\VendorCentralLoginPage.js:8:71\n    at new Promise (<anonymous>)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:11:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00e6000d-0028-0090-0065-0053006600f5.png",
        "timestamp": 1571399809805,
        "duration": 1089
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ec022befe5baaf8e2c2d78175cf46bf4",
        "instanceId": 21352,
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
        "browserLogs": [],
        "screenShotFile": "screenshots\\00cd0012-00d6-00e9-003e-00d50055007a.png",
        "timestamp": 1571399839367,
        "duration": 30027
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "b7531b90d0ebab12c1a69a03fae7a709",
        "instanceId": 11152,
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
        "browserLogs": [],
        "screenShotFile": "screenshots\\001a005c-0086-009c-0065-0071005300c5.png",
        "timestamp": 1571399948812,
        "duration": 30032
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ea05b915d3de50d1e23f2244d764ee2b",
        "instanceId": 23920,
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
        "browserLogs": [],
        "screenShotFile": "screenshots\\006000be-0050-00b2-00b6-000f00da00f4.png",
        "timestamp": 1571400108325,
        "duration": 30033
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "093a347c333e6e05b5fd77f4fbd865c7",
        "instanceId": 22368,
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
        "browserLogs": [],
        "screenShotFile": "screenshots\\009a0015-0054-0073-00d3-00c0007b0089.png",
        "timestamp": 1571400241339,
        "duration": 30030
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "4983facdcf13d972a1752359ff6dfc2a",
        "instanceId": 8460,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571400345181,
        "duration": 2986
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "62982d32120bc2e32cdf5cc503b7edb9",
        "instanceId": 6552,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571400353995,
        "duration": 1837
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "164da3f2c039adb658b2aef5f505044b",
        "instanceId": 26628,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571400388532,
        "duration": 1920
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "876337447023b1f15b935bf192b4fc2b",
        "instanceId": 26316,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571400402569,
        "duration": 19914
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "4c89a874d347ce96ed781e63ac8d1e4a",
        "instanceId": 18436,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571401489681,
        "duration": 24657
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "5875c392626287584dc129af58966a78",
        "instanceId": 6904,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Cannot read property 'all' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'all' of undefined\n    at Element.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\Element.ts:51:25)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\Element.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:18:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:9:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\009f00d2-0095-00e8-00e5-00db0055007a.png",
        "timestamp": 1571403059603,
        "duration": 13585
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "b87fc633ef56fc99c6db2334b079bfd5",
        "instanceId": 13068,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571403132307,
        "duration": 24018
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "3e889e3af4d6c859e924739b3f8bd629",
        "instanceId": 26628,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571403463090,
        "duration": 23919
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "430da12fa999b4c5df62c46966fa726a",
        "instanceId": 10460,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: UserType is not defined"
        ],
        "trace": [
            "ReferenceError: UserType is not defined\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:26:26\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:4:12)\n    at UserContext.it (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:21:40)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:112:25\n    at new Promise (<anonymous>)\n    at SimpleScheduler.promise (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\promise.js:2242:12)\n    at schedulerExecute (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:95:18)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:21:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\005800f1-0020-005b-008b-004700840036.png",
        "timestamp": 1571413251248,
        "duration": 1183
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "de617dafe74c52ef198edb9ec8302c0c",
        "instanceId": 19748,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: UserType is not defined"
        ],
        "trace": [
            "ReferenceError: UserType is not defined\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:26:26\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:4:12)\n    at UserContext.it (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:21:40)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:112:25\n    at new Promise (<anonymous>)\n    at SimpleScheduler.promise (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\promise.js:2242:12)\n    at schedulerExecute (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:95:18)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:21:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\006000ef-00f6-0026-00b8-00fe00e200d1.png",
        "timestamp": 1571413357448,
        "duration": 981
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "fbb7080813d14e00e5d4e505fe8bd0a5",
        "instanceId": 20160,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: UserType is not defined"
        ],
        "trace": [
            "ReferenceError: UserType is not defined\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:26:26\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:4:12)\n    at UserContext.it (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:21:40)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:112:25\n    at new Promise (<anonymous>)\n    at SimpleScheduler.promise (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\promise.js:2242:12)\n    at schedulerExecute (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:95:18)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:21:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00ee0056-0077-00d0-0000-0000000500b7.png",
        "timestamp": 1571413423670,
        "duration": 1041
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "3eed9a3cd03ba5c32df2e3b7b7447027",
        "instanceId": 26456,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571413599443,
        "duration": 24040
    },
    {
        "description": "encountered a declaration exception|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "eb7ef128f5a25f0034e80ebf4ae3051a",
        "instanceId": 13572,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: ENOENT: no such file or directory, open '../../src/resources/properties'",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "Error: ENOENT: no such file or directory, open '../../src/resources/properties'\n    at Object.openSync (fs.js:443:3)\n    at Object.readFileSync (fs.js:343:35)\n    at PropertiesReader.append (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\properties-reader\\src\\PropertiesReader.js:47:20)\n    at new PropertiesReader (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\properties-reader\\src\\PropertiesReader.js:14:9)\n    at PropertiesReader.builder (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\properties-reader\\src\\PropertiesReader.js:332:11)\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:11:22)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:9:1)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)",
            "WebDriverError: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:23:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\000d000e-0056-004c-007f-0046002b0068.png",
        "timestamp": 1571414366920,
        "duration": 30033
    },
    {
        "description": "encountered a declaration exception|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "93993b6653a72e2d854448ad932c252c",
        "instanceId": 13372,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: properties_reader_1.PropertiesReader is not a function",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "TypeError: properties_reader_1.PropertiesReader is not a function\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:11:22)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:9:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)\n    at Function.Module._load (internal/modules/cjs/loader.js:585:3)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)",
            "WebDriverError: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:23:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\007b009a-0058-002a-00c9-006000d80030.png",
        "timestamp": 1571414531651,
        "duration": 30034
    },
    {
        "description": "encountered a declaration exception|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "fe108f7223e1d8dbc54880cfe44ab57c",
        "instanceId": 15680,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: properties_reader_1.PropertiesReader is not a function",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "TypeError: properties_reader_1.PropertiesReader is not a function\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:11:22)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:9:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)\n    at Function.Module._load (internal/modules/cjs/loader.js:585:3)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)",
            "WebDriverError: <unknown>: Failed to read the 'sessionStorage' property from 'Window': Storage is disabled inside 'data:' URLs.\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:23:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00b100cd-0007-00c9-0019-00b000f500a8.png",
        "timestamp": 1571414632137,
        "duration": 30034
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dff01093846fda647bac70b133a568b3",
        "instanceId": 17348,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: properties is not defined"
        ],
        "trace": [
            "ReferenceError: properties is not defined\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:22:23\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:4:12)\n    at UserContext.it (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:17:40)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:112:25\n    at new Promise (<anonymous>)\n    at SimpleScheduler.promise (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\promise.js:2242:12)\n    at schedulerExecute (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\jasminewd2\\index.js:95:18)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:17:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\005700ea-00e9-00d2-0038-00270002004f.png",
        "timestamp": 1571414774033,
        "duration": 1506
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "01830e59848fa29f376133122feb7ce1",
        "instanceId": 14920,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571414799144,
        "duration": 24159
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "48a8d68160ebddc5e98ad6c840d716a1",
        "instanceId": 17896,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571414991482,
        "duration": 31381
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "649293ad5755e59bd33b59ac54e10c3f",
        "instanceId": 26020,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to contain '0yuxjdaj'.",
            "Failed: chrome not reachable\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "Error: Failed expectation\n    at Element.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\Element.ts:42:60)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\Element.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)",
            "WebDriverError: chrome not reachable\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:23:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "timestamp": 1571415256199,
        "duration": 32138
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "f385f5eb2eba0e601d8e745d2dcc5f98",
        "instanceId": 12232,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571415313619,
        "duration": 27379
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
