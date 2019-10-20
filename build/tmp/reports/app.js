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
    },
    {
        "description": "should find the add contact button|adding a new contact with only a name",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571517032523,
        "duration": 3802
    },
    {
        "description": "should type in an email address|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571517036396,
        "duration": 2775
    },
    {
        "description": "should type in a phone number|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571517039185,
        "duration": 2544
    },
    {
        "description": "should load a page and verify the url|your first protractor test",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571517041748,
        "duration": 1433
    },
    {
        "description": "should click the + button|create new contact",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571517043199,
        "duration": 2273
    },
    {
        "description": "should fill out form for a new contact|create new contact",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to be '1', 'Phone field should be empty'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\CreateNewContactSpec.ts:32:45)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\CreateNewContactSpec.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00b1004b-003d-00d9-0076-001800170029.png",
        "timestamp": 1571517045489,
        "duration": 2903
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571517050575,
                "type": ""
            }
        ],
        "timestamp": 1571517048767,
        "duration": 2788
    },
    {
        "description": "shouldn’t create a new contact with baduser.com|adding a new contact with an invalid email",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571517051572,
        "duration": 2677
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6a5a4dc47c70cc8c675019c4a9ede8b0",
        "instanceId": 4104,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571517056429,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571517056430,
                "type": ""
            }
        ],
        "timestamp": 1571517054267,
        "duration": 5574
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "3cf5826514b6d0d2437fb2728cfe9ed8",
        "instanceId": 27312,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571517515610,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571517516674,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571517516675,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://api-analytics.rozetka.com.ua/js/exponea.min.js 29:258 \"Exponea [Sat, 19 Oct 2019 20:38:38 GMT] Missing Google Analytics SDK (window.ga is not defined). Either integrate Google Analytics with your website or disable Google Analytics integration in the SDK config:\\nhttps://docs.exponea.com/docs/config-object\"",
                "timestamp": 1571517519020,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/pages/136/136461.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/136/136928.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/146/146693.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/137/137033.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/pages/137/137012.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_articles/138/138289.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_articles/138/138282.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_articles/138/138275.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_news/83/83711.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_news/74/74952.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_news/74/74572.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple - Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/136/136482.png'. This content should also be served over HTTPS.",
                "timestamp": 1571517519021,
                "type": ""
            }
        ],
        "timestamp": 1571517514501,
        "duration": 5261
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "3a465d21315112dd45a7676d356aa735",
        "instanceId": 12236,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571517580756,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571517581731,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571517581732,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://api-analytics.rozetka.com.ua/js/exponea.min.js 29:258 \"Exponea [Sat, 19 Oct 2019 20:39:43 GMT] Missing Google Analytics SDK (window.ga is not defined). Either integrate Google Analytics with your website or disable Google Analytics integration in the SDK config:\\nhttps://docs.exponea.com/docs/config-object\"",
                "timestamp": 1571517584422,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/pages/136/136461.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584422,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/136/136928.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/146/146693.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/137/137033.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/pages/137/137012.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_articles/138/138289.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_articles/138/138282.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_articles/138/138275.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_news/83/83711.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_news/74/74952.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_news/74/74572.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple - Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/136/136482.png'. This content should also be served over HTTPS.",
                "timestamp": 1571517584423,
                "type": ""
            }
        ],
        "timestamp": 1571517579649,
        "duration": 5334
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "1498a2acd3d2eeab6ee590bdbb66c93f",
        "instanceId": 21652,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Cannot find module '../../../build/email.js'"
        ],
        "trace": [
            "Error: Cannot find module '../../../build/email.js'\n    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:636:15)\n    at Function.Module._load (internal/modules/cjs/loader.js:562:25)\n    at Module.require (internal/modules/cjs/loader.js:692:17)\n    at require (internal/modules/cjs/helpers.js:25:18)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\RozetkaSpecs.ts:16:28)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\RozetkaSpecs.ts:10:5)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:4:12)\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:15:12)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571517975736,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571517977370,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571517977370,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\001000aa-0048-00e9-0030-0098003a0062.png",
        "timestamp": 1571517974668,
        "duration": 4588
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "01eec83435955edb929daaf0068c18f1",
        "instanceId": 27460,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571518167228,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571518167229,
                "type": ""
            }
        ],
        "timestamp": 1571518159717,
        "duration": 10904
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "baeb010c2005f68dac4d896e1c094c30",
        "instanceId": 8980,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:3627 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571518657130,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://xl-static.rozetka.com.ua/polyfills.acbc2b6358e49627e58e.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1571518657131,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://xl-static.rozetka.com.ua/polyfills.acbc2b6358e49627e58e.js 0 Access to XMLHttpRequest at 'https://connect.facebook.net/log/error' from origin 'https://rozetka.com.ua' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1571518657261,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://xl-static.rozetka.com.ua/polyfills.acbc2b6358e49627e58e.js 0 Failed to load resource: net::ERR_FAILED",
                "timestamp": 1571518657262,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:3627 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571518657262,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://xl-static.rozetka.com.ua/polyfills.acbc2b6358e49627e58e.js 0 Access to XMLHttpRequest at 'https://connect.facebook.net/log/error' from origin 'https://rozetka.com.ua' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
                "timestamp": 1571518657379,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://xl-static.rozetka.com.ua/polyfills.acbc2b6358e49627e58e.js 0 Failed to load resource: net::ERR_FAILED",
                "timestamp": 1571518657379,
                "type": ""
            }
        ],
        "timestamp": 1571518654541,
        "duration": 6621
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "5bf8ea7465d96a16b7d1a9a592e4eafa",
        "instanceId": 15732,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: script timeout\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "ScriptTimeoutError: script timeout\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at Element.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at HomePage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\HomePage.ts:40:28)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\HomePage.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\HomePage.js:4:12)\n    at HomePage.search (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\HomePage.js:39:16)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\RozetkaSpecs.ts:15:24)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\RozetkaSpecs.ts:10:5)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:4:12)\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:15:12)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571519039498,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571519040550,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571519040551,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\0027004b-0092-00e1-0000-00ec009800e3.png",
        "timestamp": 1571519038690,
        "duration": 14119
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "54e3d7193ff2d297b5e13729ed9a455c",
        "instanceId": 18376,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: script timeout\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "ScriptTimeoutError: script timeout\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at Element.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at HomePage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\HomePage.ts:40:28)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\HomePage.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\HomePage.js:4:12)\n    at HomePage.search (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\HomePage.js:39:16)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\RozetkaSpecs.ts:15:24)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\RozetkaSpecs.ts:10:5)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:4:12)\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\RozetkaSpecs.js:15:12)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571519134680,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571519135616,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571519135617,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\006f0033-000f-00dd-00cb-006e00670017.png",
        "timestamp": 1571519133414,
        "duration": 13884
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "2ea0e867dd30165b5488453202c569c7",
        "instanceId": 22808,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571519194266,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571519195096,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571519195097,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://api-analytics.rozetka.com.ua/js/exponea.min.js 29:258 \"Exponea [Sat, 19 Oct 2019 21:06:36 GMT] Missing Google Analytics SDK (window.ga is not defined). Either integrate Google Analytics with your website or disable Google Analytics integration in the SDK config:\\nhttps://docs.exponea.com/docs/config-object\"",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/pages/136/136461.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/136/136928.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/146/146693.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/137/137033.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 928 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/pages/137/137012.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_articles/138/138289.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_articles/138/138282.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_articles/138/138275.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_news/83/83711.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i2.rozetka.ua/publications_news/74/74952.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple 1098 Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/publications_news/74/74572.jpg'. This content should also be served over HTTPS.",
                "timestamp": 1571519197549,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://rozetka.com.ua/apple/c4627486/#search_text=Apple - Mixed Content: The page at 'https://rozetka.com.ua/apple/c4627486/#search_text=Apple' was loaded over HTTPS, but requested an insecure image 'http://i1.rozetka.ua/pages/136/136482.png'. This content should also be served over HTTPS.",
                "timestamp": 1571519197550,
                "type": ""
            }
        ],
        "timestamp": 1571519193026,
        "duration": 4930
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "f36f87178a6f65b923f135f41c807241",
        "instanceId": 9256,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571519498899,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571519501470,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571519501470,
                "type": ""
            }
        ],
        "timestamp": 1571519496967,
        "duration": 7362
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "0ac539e98d395e90841ac01e98dc4d99",
        "instanceId": 5516,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571519680585,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571519680585,
                "type": ""
            }
        ],
        "timestamp": 1571519677216,
        "duration": 6455
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ba7977edf1ddc9346d4c1140d11874bb",
        "instanceId": 11880,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571519787374,
                "type": ""
            }
        ],
        "timestamp": 1571519784761,
        "duration": 3619
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ba7977edf1ddc9346d4c1140d11874bb",
        "instanceId": 11880,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571519790236,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571519791270,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571519791271,
                "type": ""
            }
        ],
        "timestamp": 1571519788442,
        "duration": 4365
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "1c2c2da04c6abd789a0bd242b2b74e00",
        "instanceId": 25812,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571519935145,
                "type": ""
            }
        ],
        "timestamp": 1571519932164,
        "duration": 4055
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "1c2c2da04c6abd789a0bd242b2b74e00",
        "instanceId": 25812,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571519942308,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571519943370,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571519943371,
                "type": ""
            }
        ],
        "timestamp": 1571519936280,
        "duration": 8290
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "2276c9aacfe82ac5dc347575512e68eb",
        "instanceId": 26572,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571519975729,
                "type": ""
            }
        ],
        "timestamp": 1571519973015,
        "duration": 3714
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "bacc72dfd2a500b136a7390f737a6e79",
        "instanceId": 11656,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571520065392,
                "type": ""
            }
        ],
        "timestamp": 1571520062972,
        "duration": 3322
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "abfe08918c9006e336d9a0eb3cfa71eb",
        "instanceId": 23172,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571520693088,
                "type": ""
            }
        ],
        "timestamp": 1571520691404,
        "duration": 2653
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "4be18b9de661eb123d962c9e059f4375",
        "instanceId": 16596,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571521405249,
                "type": ""
            }
        ],
        "timestamp": 1571521403629,
        "duration": 2601
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "43c3c87e2fe25d56e2ba1eec9ed2a076",
        "instanceId": 16700,
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
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571521582033,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00250007-0079-0086-00f1-00d0006d00c5.png",
        "timestamp": 1571521434863,
        "duration": 146894
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "c3376739ef9cf18129b0d993bdd09143",
        "instanceId": 18356,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: ECONNABORTED write ECONNABORTED"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)",
            "Error: ECONNABORTED write ECONNABORTED\n    at ClientRequest.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\http\\index.js:238:15)\n    at ClientRequest.emit (events.js:198:13)\n    at Socket.socketErrorListener (_http_client.js:392:9)\n    at Socket.emit (events.js:198:13)\n    at errorOrDestroy (internal/streams/destroy.js:107:12)\n    at onwriteError (_stream_writable.js:436:5)\n    at onwrite (_stream_writable.js:461:5)\n    at _destroy (internal/streams/destroy.js:49:7)\n    at Socket._destroy (net.js:613:3)\n    at Socket.destroy (internal/streams/destroy.js:37:8)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:23:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\005d0041-0073-0040-0071-000a00b30021.png",
        "timestamp": 1571521696037,
        "duration": 568589
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8e6edf05e588c0eebe43afdcab5637cd",
        "instanceId": 6132,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571549479021,
                "type": ""
            }
        ],
        "timestamp": 1571549477164,
        "duration": 3206
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "d6945981aee4d9a2d34fddc0aabf7403",
        "instanceId": 26344,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "TypeError: email_1.authorize is not a function"
        ],
        "trace": [
            "TypeError: email_1.authorize is not a function\n    at fs.readFile (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\FirstTestSpecs.ts:19:13)\n    at FSReqWrap.readFileAfterClose [as oncomplete] (internal/fs/read_file_context.js:53:3)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\002c00dd-0085-00f5-00c3-00ae001d0064.png",
        "timestamp": 1571549641804,
        "duration": 1268
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "7e46afd2cca308e182add8d8eb74c971",
        "instanceId": 15652,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571549692785,
                "type": ""
            }
        ],
        "timestamp": 1571549691179,
        "duration": 2676
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "96d86c97ae08a15f1ea6c3c8b37d9877",
        "instanceId": 10552,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571570162248,
                "type": ""
            }
        ],
        "timestamp": 1571570160111,
        "duration": 3323
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "4388f09591cc9f4daf500c4fe34cd97a",
        "instanceId": 19848,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571571977663,
                "type": ""
            }
        ],
        "timestamp": 1571571975677,
        "duration": 3022
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "32e425e1a78b0084ef209188b7b9c099",
        "instanceId": 18716,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571572218752,
                "type": ""
            }
        ],
        "timestamp": 1571572215933,
        "duration": 3841
    },
    {
        "description": "should find the add contact button|adding a new contact with only a name",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572255143,
        "duration": 5166
    },
    {
        "description": "should type in an email address|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572260420,
        "duration": 2829
    },
    {
        "description": "should type in a phone number|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572263275,
        "duration": 2772
    },
    {
        "description": "should load a page and verify the url|your first protractor test",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572266075,
        "duration": 1573
    },
    {
        "description": "should click the + button|create new contact",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572267681,
        "duration": 2397
    },
    {
        "description": "should fill out form for a new contact|create new contact",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to be '1', 'Phone field should be empty'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\CreateNewContactSpec.ts:32:45)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\CreateNewContactSpec.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\009600b7-00b7-0014-00c4-00090007008b.png",
        "timestamp": 1571572270105,
        "duration": 3215
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571572275859,
                "type": ""
            }
        ],
        "timestamp": 1571572273731,
        "duration": 3240
    },
    {
        "description": "shouldn’t create a new contact with baduser.com|adding a new contact with an invalid email",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572276997,
        "duration": 2834
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6bea8d2636093344ea39ec432ed0171e",
        "instanceId": 26412,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://static.rozetka.com.ua/main.518da7047865711da615.js 0 Unrecognized feature: 'encallowfullscreenrypted-media'.",
                "timestamp": 1571572282655,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571572298613,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571572298614,
                "type": ""
            }
        ],
        "timestamp": 1571572279868,
        "duration": 28303
    },
    {
        "description": "should find the add contact button|adding a new contact with only a name",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572351402,
        "duration": 3709
    },
    {
        "description": "should type in an email address|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572355219,
        "duration": 2804
    },
    {
        "description": "should type in a phone number|adding a new contact with name, email,and phone number",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572358047,
        "duration": 2566
    },
    {
        "description": "should load a page and verify the url|your first protractor test",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572360641,
        "duration": 1518
    },
    {
        "description": "should click the + button|create new contact",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572362193,
        "duration": 2384
    },
    {
        "description": "should fill out form for a new contact|create new contact",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to be '1', 'Phone field should be empty'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\CreateNewContactSpec.ts:32:45)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\CreateNewContactSpec.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00490006-00c1-0081-009d-009e007b00f3.png",
        "timestamp": 1571572364600,
        "duration": 3098
    },
    {
        "description": "First Test on protractor|Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://todomvc.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1571572370950,
                "type": ""
            }
        ],
        "timestamp": 1571572368098,
        "duration": 3928
    },
    {
        "description": "shouldn’t create a new contact with baduser.com|adding a new contact with an invalid email",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572372053,
        "duration": 2768
    },
    {
        "description": "Test rozetka search|Rozetka Suite",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "81544577c56dd4fd86b124195a4bd5b3",
        "instanceId": 25196,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 480863978968397.\"",
                "timestamp": 1571572383834,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 23:5220 \"[Facebook Pixel] - Duplicate Pixel ID: 122789221703310.\"",
                "timestamp": 1571572383834,
                "type": ""
            }
        ],
        "timestamp": 1571572374847,
        "duration": 15038
    },
    {
        "description": "should find the add contact button|adding a new contact with only a name",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "aa928996e6c4a7aea4c3459b440fec15",
        "instanceId": 12872,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571572421417,
        "duration": 3302
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "09bb596013a3d8cb147b6dab7e308535",
        "instanceId": 19420,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571573488087,
        "duration": 26190
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "416a286e3fc78ec9cc321f42bf56398d",
        "instanceId": 13652,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571573574094,
        "duration": 28016
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ca5f5a30e15c6c2ad44c85125741ccc3",
        "instanceId": 22120,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571573627491,
        "duration": 24574
    },
    {
        "description": "user can register|registration",
        "passed": true,
        "pending": false,
        "os": "windows nt",
        "sessionId": "e1b4927d523231d9f1ad4541222be76d",
        "instanceId": 22160,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1571573842856,
        "duration": 27310
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "144913d3e22429643c621f77c9ffee43",
        "instanceId": 27012,
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
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.7kWSr24wXFc.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo-i9r7IbCTUQfJ0v-FPhRKRS8aihQ/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571578862601,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.7kWSr24wXFc.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo-i9r7IbCTUQfJ0v-FPhRKRS8aihQ/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571578862602,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.7kWSr24wXFc.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo-i9r7IbCTUQfJ0v-FPhRKRS8aihQ/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571578862602,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.7kWSr24wXFc.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo-i9r7IbCTUQfJ0v-FPhRKRS8aihQ/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571578862602,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578864506,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578864506,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578864601,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578864601,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\003b005c-007b-009c-003e-00ce000d00e8.png",
        "timestamp": 1571578827132,
        "duration": 39243
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "395d81e3bd193928395029452dc172a1",
        "instanceId": 22132,
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
                "timestamp": 1571578997563,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578997563,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578997659,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578997659,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578997759,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571578997759,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00af0062-00b6-0012-0056-00c0003e00a3.png",
        "timestamp": 1571578950192,
        "duration": 54233
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "5ac29fc081c90a4f1419d4d02bbca35a",
        "instanceId": 22416,
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
                "timestamp": 1571579234636,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571579234636,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00f1005b-00ad-001c-0057-005800eb0078.png",
        "timestamp": 1571579200461,
        "duration": 37854
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "822943c4593b39de71d1f709819f6482",
        "instanceId": 25084,
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
                "timestamp": 1571579318800,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571579318800,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571579318894,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571579318894,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://people-pa.clients6.google.com/v2/people/me/allPeople?key=AIzaSyD7InnYR3VKdb4j2rMUEbTCIr2VyEazl6k - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1571579320491,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571579320659,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571579320659,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571579320661,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://hangouts.google.com/_/scs/chat-static/_/js/k=chat.smh.ru.9rgiyjQ1fd4.O/am=DA/d=0/ct=zgms/rs=AGNGyv2qj1coIHc5TkL0SHqr5ZdsCgKprw/m=b 413 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571579320661,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\0041008f-001f-00d6-00cb-00ee00df003f.png",
        "timestamp": 1571579283604,
        "duration": 37062
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "cbd18aa2a061f04b44189174ab33c810",
        "instanceId": 5556,
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
        "screenShotFile": "screenshots\\00360028-0060-0050-00cc-00d1001f00ce.png",
        "timestamp": 1571586381027,
        "duration": 36108
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "92fc7f989dc9060bda08ae875543fe4f",
        "instanceId": 14452,
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
                "timestamp": 1571586492468,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571586492468,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00bf008d-0069-00c5-0052-0053001d0038.png",
        "timestamp": 1571586426507,
        "duration": 66134
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "62acd9127853a73a3e6ae7ad75ac9806",
        "instanceId": 10144,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '03' to contain '03hpwvao'.",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Failed expectation\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:34:60)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\004800c6-00d6-0017-00de-005d0062003f.png",
        "timestamp": 1571586703622,
        "duration": 33400
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "d0be32fdcd17bbb9b72c77639f296831",
        "instanceId": 27396,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: stale element reference: element is not attached to the page document\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)",
            "StaleElementReferenceError: stale element reference: element is not attached to the page document\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at GmailMainPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\GmailMainPage.ts:21:31)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\GmailMainPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:22:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571586915190,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571586915191,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00de0054-00c5-0074-00a2-006c00ca00b5.png",
        "timestamp": 1571586881547,
        "duration": 34828
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "10d7a5a41fdebc0c2e58380b634569a0",
        "instanceId": 15180,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: stale element reference: element is not attached to the page document\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "StaleElementReferenceError: stale element reference: element is not attached to the page document\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at GmailMainPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\GmailMainPage.ts:21:31)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\GmailMainPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587106971,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587106971,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00ab00e1-0024-0085-00a6-00ee00af00db.png",
        "timestamp": 1571587069512,
        "duration": 38681
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "5ec6fe30c88f931c4dd5fd5a02629d7e",
        "instanceId": 22524,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Cannot read property 'enterPassword' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'enterPassword' of undefined\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:44:70)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\test\\specs\\MetroSpecTests.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587215220,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587215220,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00190017-009e-0000-008f-001a004500ed.png",
        "timestamp": 1571587181086,
        "duration": 42705
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "97edfac38b1f2372a95da938b38adb02",
        "instanceId": 23908,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, (//a[contains(@href, 'grid')])[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, (//a[contains(@href, 'grid')])[1])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587335550,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587335551,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00150076-0060-0041-0009-0002004d0034.png",
        "timestamp": 1571587300099,
        "duration": 61619
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "2ace9f793344763d5a5aa5a31db4bd25",
        "instanceId": 12004,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, (//a[contains(@href, 'grid')])[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, (//a[contains(@href, 'grid')])[1])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587434080,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587434080,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587434177,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571587434177,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\005300f5-0068-0036-008c-00ae002100e2.png",
        "timestamp": 1571587400649,
        "duration": 59952
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "18ef560924edc35bad1e00661a41ba69",
        "instanceId": 24484,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, (//a[contains(@href, 'grid')])[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, (//a[contains(@href, 'grid')])[1])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588110760,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588110760,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588110846,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588110846,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00d600a9-00b2-00dc-00a1-00e5008d006c.png",
        "timestamp": 1571588073354,
        "duration": 63947
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "b396f7db9e1d0923f97bb6c6c6130945",
        "instanceId": 22728,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Angular could not be found on the page https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:720:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588279930,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588279930,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00830002-00fe-0014-0003-007300ae008d.png",
        "timestamp": 1571588245523,
        "duration": 50527
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6eb800a613906d218202cd5033261ac1",
        "instanceId": 24488,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Angular could not be found on the page https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:720:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588568420,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588568420,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/apps-static/_/js/k=oz.gapi.ru.a-DqiwwKLYg.O/m=client/rt=j/sv=1/d=1/ed=1/am=wQE/rs=AGLTcCMoXIFGig1h17SYRmDDsvlhFdyC1w/cb=gapi.loaded_0 732 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571588570177,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/apps-static/_/js/k=oz.gapi.ru.a-DqiwwKLYg.O/m=client/rt=j/sv=1/d=1/ed=1/am=wQE/rs=AGLTcCMoXIFGig1h17SYRmDDsvlhFdyC1w/cb=gapi.loaded_0 732 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571588570178,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/apps-static/_/js/k=oz.gapi.ru.a-DqiwwKLYg.O/m=client/rt=j/sv=1/d=1/ed=1/am=wQE/rs=AGLTcCMoXIFGig1h17SYRmDDsvlhFdyC1w/cb=gapi.loaded_0 732 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571588570178,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00bb0086-00a2-001f-0029-002b00f300b4.png",
        "timestamp": 1571588499501,
        "duration": 85499
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "b1a8c568693b1916123c860ae510b2fe",
        "instanceId": 9604,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: stale element reference: element is not attached to the page document\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "StaleElementReferenceError: stale element reference: element is not attached to the page document\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588882479,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571588882479,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://0.client-channel.google.com/client-channel/channel/bind?ctype=hangouts&prop=gmail&appver=babel-chat.frontend_20191010.05_p0&gsessionid=CqDkOVcK_77phaNDT06-sedrM9p6LdfI&VER=8&RID=62834&CVER=5&zx=pc0zfghqn5nx&t=1 - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1571588886810,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00570058-0091-007a-0033-005900e9002a.png",
        "timestamp": 1571588848514,
        "duration": 38292
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "dd9a1c773df6b237cfbe585f8d07ee99",
        "instanceId": 23336,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: BUG: elementArrayFinder cannot be empty"
        ],
        "trace": [
            "Error: BUG: elementArrayFinder cannot be empty\n    at new ElementFinder (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:791:19)\n    at new BaseFragment (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor-element-extend\\index.ts:12:5)\n    at new WebElement (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:11:9)\n    at new VendorContractConfirmPage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\VendorContractConfirmPage.ts:21:45)\n    at ResetPasswordPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\ResetPasswordPage.ts:28:16)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\ResetPasswordPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571589184202,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571589184202,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\007800e6-00b1-0076-0091-0009008d0007.png",
        "timestamp": 1571589149954,
        "duration": 39834
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "9cafb07d98960673825c26f6f2379835",
        "instanceId": 23752,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, *[id=\"reset_password_newPassword_first\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, *[id=\"reset_password_newPassword_first\"])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571589336800,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571589336800,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00c4006b-00f2-0050-00d5-0019004b003b.png",
        "timestamp": 1571589302648,
        "duration": 72322
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "9bc0d8933ae5921e39340ca3603af9a8",
        "instanceId": 21908,
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
                "timestamp": 1571590990941,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571590990941,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.qa.metro-vendorcentral.com/vendor/client-api/v1/auth/userinfo?locale=en-US - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1571591109451,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:580990 \"ERROR\" Error: Uncaught (in promise): Object: {\"headers\":{\"normalizedNames\":{},\"lazyUpdate\":null},\"status\":401,\"statusText\":\"OK\",\"url\":\"https://www.qa.metro-vendorcentral.com/vendor/client-api/v1/auth/userinfo?locale=en-US\",\"ok\":false,\"name\":\"HttpErrorResponse\",\"message\":\"Http failure response for https://www.qa.metro-vendorcentral.com/vendor/client-api/v1/auth/userinfo?locale=en-US: 401 OK\",\"error\":{\"message\":\"Authentication Required\"},\"extMessage\":\"\",\"extError\":401,\"extData\":null}\n    at M (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:14429)\n    at M (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:13987)\n    at https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:15252\n    at t.invokeTask (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:9171)\n    at Object.onInvokeTask (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js:1:593051)\n    at t.invokeTask (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:9092)\n    at e.runTask (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:4349)\n    at g (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:11462)\n    at e.invokeTask [as invoke] (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:10307)\n    at m (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:23786)",
                "timestamp": 1571591109452,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.qa.metro-vendorcentral.com/vendor/client-api/v1/feature-flags?locale=en-US - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1571591109452,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\008800cd-0040-00b0-00f0-00c000cd00ac.png",
        "timestamp": 1571590956626,
        "duration": 152279
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "12ad61c8d19f3b3f60a62a785195ebf0",
        "instanceId": 25372,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected 'gpv1r1r' to contain 'gpv1r1rj'.",
            "Failed: no such window: target window already closed\nfrom unknown error: web view not found\n  (Session info: chrome=77.0.3865.120)",
            "Failed: no such window: target window already closed\nfrom unknown error: web view not found\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "Error: Failed expectation\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:34:60)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)",
            "NoSuchWindowError: no such window: target window already closed\nfrom unknown error: web view not found\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)",
            "NoSuchWindowError: no such window: target window already closed\nfrom unknown error: web view not found\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:23:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571591509607,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571591509607,
                "type": ""
            }
        ],
        "timestamp": 1571591474331,
        "duration": 62091
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "b6e019ca0d24b3ddf5f6ae5781cdacdd",
        "instanceId": 27012,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, #reset_password_newPassword_first)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, #reset_password_newPassword_first)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571591626045,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571591626045,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\005e00fd-0051-0060-00af-008c00080062.png",
        "timestamp": 1571591591663,
        "duration": 72419
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ea4200bf18473a5fbf1280577f1765a7",
        "instanceId": 26408,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: BUG: elementArrayFinder cannot be empty"
        ],
        "trace": [
            "Error: BUG: elementArrayFinder cannot be empty\n    at new ElementFinder (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:791:19)\n    at new BaseFragment (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor-element-extend\\index.ts:12:5)\n    at new WebElement (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:11:9)\n    at new VendorContractConfirmPage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\VendorContractConfirmPage.ts:21:45)\n    at ResetPasswordPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\ResetPasswordPage.ts:28:16)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\ResetPasswordPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592289717,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592289717,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592289776,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592289776,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\0087001d-0051-0085-0097-000700540073.png",
        "timestamp": 1571592247906,
        "duration": 55325
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "5790cf39ab83f1bb19499361751e550e",
        "instanceId": 8084,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Expected '' to contain '8x1q6ehb'.",
            "Failed: No element found using locator: By(css selector, .callout-success)"
        ],
        "trace": [
            "Error: Failed expectation\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:35:60)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)",
            "NoSuchElementError: No element found using locator: By(css selector, .callout-success)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as getText] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at SMSHomePage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\SMSHomePage.ts:53:42)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:4:12)\n    at SMSHomePage.getMessage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:48:16)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:37:37)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\0065009d-0046-00e5-004a-0071007c00ba.png",
        "timestamp": 1571592705607,
        "duration": 20094
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "1fdabf772a01c0cc9925799be7ce0a11",
        "instanceId": 25624,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: BUG: elementArrayFinder cannot be empty"
        ],
        "trace": [
            "Error: BUG: elementArrayFinder cannot be empty\n    at new ElementFinder (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:791:19)\n    at new BaseFragment (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor-element-extend\\index.ts:12:5)\n    at new WebElement (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:11:9)\n    at new VendorContractConfirmPage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\VendorContractConfirmPage.ts:22:45)\n    at ResetPasswordPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\ResetPasswordPage.ts:28:16)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\ResetPasswordPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592811356,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592811357,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592811452,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592811452,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00040040-0073-004a-00b9-00e9009a0015.png",
        "timestamp": 1571592774640,
        "duration": 59599
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "b465650c49163e1dc2d4c39837a77480",
        "instanceId": 11520,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: BUG: elementArrayFinder cannot be empty"
        ],
        "trace": [
            "Error: BUG: elementArrayFinder cannot be empty\n    at new ElementFinder (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:791:19)\n    at new BaseFragment (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor-element-extend\\index.ts:12:5)\n    at new WebElement (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:11:9)\n    at new VendorContractConfirmPage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\VendorContractConfirmPage.ts:21:27)\n    at ResetPasswordPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\ResetPasswordPage.ts:28:16)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\ResetPasswordPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592968960,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592968960,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592969054,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571592969054,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\001b00c3-0052-00b8-00d1-009c009200ea.png",
        "timestamp": 1571592933296,
        "duration": 55801
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "de7f7f8f3c5dc7e7843678925ec18c11",
        "instanceId": 18460,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: BUG: elementArrayFinder cannot be empty"
        ],
        "trace": [
            "Error: BUG: elementArrayFinder cannot be empty\n    at new ElementFinder (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:791:19)\n    at new BaseFragment (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor-element-extend\\index.ts:12:5)\n    at new WebElement (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:11:9)\n    at new VendorContractConfirmPage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\VendorContractConfirmPage.ts:12:34)\n    at ResetPasswordPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\ResetPasswordPage.ts:28:16)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\ResetPasswordPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571593103630,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571593103631,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\006200be-0090-006e-00ca-003d00c30090.png",
        "timestamp": 1571593068627,
        "duration": 43027
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "448f6f5b2572bc90b6616d6d5075998d",
        "instanceId": 21280,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .callout-success)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .callout-success)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as getText] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at SMSHomePage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\SMSHomePage.ts:53:42)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:4:12)\n    at SMSHomePage.getMessage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:48:16)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:37:37)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\000800b4-0081-0057-005f-000f004300ae.png",
        "timestamp": 1571593232169,
        "duration": 21030
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "576df0a15a1f3aaa4a9b29b31dd10094",
        "instanceId": 14904,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: BUG: elementArrayFinder cannot be empty"
        ],
        "trace": [
            "Error: BUG: elementArrayFinder cannot be empty\n    at new ElementFinder (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:791:19)\n    at new BaseFragment (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor-element-extend\\index.ts:12:5)\n    at new WebElement (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:11:9)\n    at new VendorContractConfirmPage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\VendorContractConfirmPage.ts:13:26)\n    at ResetPasswordPage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\ResetPasswordPage.ts:28:16)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\ResetPasswordPage.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571593347817,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571593347817,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00c300b3-003e-00a2-00f7-00ec007a009c.png",
        "timestamp": 1571593313653,
        "duration": 43677
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "f4850de80ff16c2d62072c6ad5f0fa3c",
        "instanceId": 26976,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .send-email-modal--content .m-checkbox svg)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .send-email-modal--content .m-checkbox svg)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571593417853,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571593417853,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\003100d3-00f6-0080-00ce-0002000b001c.png",
        "timestamp": 1571593380728,
        "duration": 76776
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ee36a1c032d9b9b6ef271a77355aa249",
        "instanceId": 26836,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Failed: No element found using locator: By(css selector, .send-email-modal--content .m-checkbox svg)"
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at ontimeout (timers.js:436:11)\n    at tryOnTimeout (timers.js:300:5)\n    at listOnTimeout (timers.js:263:5)\n    at Timer.processTimers (timers.js:223:10)",
            "NoSuchElementError: No element found using locator: By(css selector, .send-email-modal--content .m-checkbox svg)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571593516682,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571593516682,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/apps-static/_/js/k=oz.gapi.ru.a-DqiwwKLYg.O/m=client/rt=j/sv=1/d=1/ed=1/am=wQE/rs=AGLTcCMoXIFGig1h17SYRmDDsvlhFdyC1w/cb=gapi.loaded_0 732 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571593517729,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/apps-static/_/js/k=oz.gapi.ru.a-DqiwwKLYg.O/m=client/rt=j/sv=1/d=1/ed=1/am=wQE/rs=AGLTcCMoXIFGig1h17SYRmDDsvlhFdyC1w/cb=gapi.loaded_0 732 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571593517729,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/apps-static/_/js/k=oz.gapi.ru.a-DqiwwKLYg.O/m=client/rt=j/sv=1/d=1/ed=1/am=wQE/rs=AGLTcCMoXIFGig1h17SYRmDDsvlhFdyC1w/cb=gapi.loaded_0 732 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1571593517730,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\0039002c-00ea-00ff-0036-00e20041009c.png",
        "timestamp": 1571593482493,
        "duration": 109662
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "c077a39054e416d3dcab9e4616a3172b",
        "instanceId": 15032,
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
                "timestamp": 1571594167973,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571594167974,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571594168070,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571594168070,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00a5002b-0048-007b-0004-0024008300dc.png",
        "timestamp": 1571594132697,
        "duration": 108856
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6578d0d871fdff13aa5ee150e0eaf188",
        "instanceId": 1864,
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
                "timestamp": 1571594377683,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571594377683,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\009900fa-00d4-00b1-0073-00f7006600c0.png",
        "timestamp": 1571594342153,
        "duration": 107438
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "e45bea3222b3e7d9df49a8d967f88b33",
        "instanceId": 9556,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, #reset_password_newPassword_first)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, #reset_password_newPassword_first)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595162348,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595162348,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\005d0091-00d8-000f-0061-000400f800ae.png",
        "timestamp": 1571595127964,
        "duration": 72615
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "d73c9606b342a640a485c1348cbcaa21",
        "instanceId": 19272,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "ElementNotInteractableError: element not interactable\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00d200d6-0081-0053-0061-00fe00f90073.png",
        "timestamp": 1571595321077,
        "duration": 64991
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "9c5ec956e9ebaba0c156632f6af4b871",
        "instanceId": 24236,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:463:23)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595445237,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595445237,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\003d00e0-00eb-000b-00c6-00cb00900023.png",
        "timestamp": 1571595411877,
        "duration": 55173
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "05b238407b30eb23d6cde13898a00d13",
        "instanceId": 26244,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:463:23)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595516107,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595516107,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00370084-003e-008f-008a-003a00e6003b.png",
        "timestamp": 1571595482911,
        "duration": 39956
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ce428011535220abc83c6666006184e7",
        "instanceId": 5700,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:463:23)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595584084,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595584084,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595584181,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571595584181,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\001500a7-000e-009a-00de-00dc0032000e.png",
        "timestamp": 1571595551302,
        "duration": 39045
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a1fcfdc749610ceaba6189258d2c742b",
        "instanceId": 12164,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Error while running testForAngular: script timeout\n  (Session info: chrome=77.0.3865.120)",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while running testForAngular: script timeout\n  (Session info: chrome=77.0.3865.120)\n    at executeAsyncScript_.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:727:23)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:17:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:463:23)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\004e002e-0030-004b-00f5-005900560051.png",
        "timestamp": 1571595858651,
        "duration": 12244
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ea7600565d6703458484028180646b25",
        "instanceId": 11616,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Angular could not be found on the page http://www.gmail.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page http://www.gmail.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:720:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00500004-002b-00d0-0056-00f800c400b2.png",
        "timestamp": 1571596002875,
        "duration": 27327
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "c4ba55af609e5747ffca4cf8d8b65f7a",
        "instanceId": 15872,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .callout-success)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .callout-success)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as getText] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at SMSHomePage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\SMSHomePage.ts:57:42)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:4:12)\n    at SMSHomePage.getMessage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:52:16)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:37:37)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\0086007d-0030-0069-00dd-00de00c6009a.png",
        "timestamp": 1571596158419,
        "duration": 20066
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "6b5fa010a31ad0f429f9b84381521eee",
        "instanceId": 21000,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:463:23)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00a50090-0089-00d6-00ba-00cb00600031.png",
        "timestamp": 1571596345418,
        "duration": 6735
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "696992809d3629bf76db7171222188ba",
        "instanceId": 10228,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:463:23)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\001b000f-005d-0069-00ad-005a00b0003f.png",
        "timestamp": 1571596378400,
        "duration": 6518
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "0e06fe7a9db6f6d808e74592c1b218e2",
        "instanceId": 24096,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at runWaitForAngularScript.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:463:23)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00400098-003a-00c2-00ed-00d70043008a.png",
        "timestamp": 1571596440971,
        "duration": 13281
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "8094ecd9c619c2469400520823a12abf",
        "instanceId": 10928,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: Angular could not be found on the page http://www.gmail.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page http://www.gmail.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at executeAsyncScript_.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\browser.js:720:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\00070072-00ef-00f5-001a-005100e100e6.png",
        "timestamp": 1571596492650,
        "duration": 27256
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "1410edc741d5a27ef5842264445edb65",
        "instanceId": 15456,
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
                "timestamp": 1571596604750,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571596604750,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00670006-0078-002f-0044-008000670018.png",
        "timestamp": 1571596566928,
        "duration": 109014
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "ba007f5f39684e3e85669cfad760606b",
        "instanceId": 2360,
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
                "timestamp": 1571596749195,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571596749195,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\009a0088-005a-0005-00e6-0041009f001f.png",
        "timestamp": 1571596709923,
        "duration": 106871
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "763acd54841bdb35eb08bd75a6b7f67e",
        "instanceId": 22988,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: invalid argument: missing 'value'\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "InvalidArgumentError: invalid argument: missing 'value'\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571597623272,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571597623273,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\00de00d6-00b9-0072-00a0-004800f800cc.png",
        "timestamp": 1571597583771,
        "duration": 44407
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "62ffdec83da44abe0af87a5d292c3fb9",
        "instanceId": 10084,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, .callout-success)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, .callout-success)\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as getText] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at SMSHomePage.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\pageobjects\\metro\\SMSHomePage.ts:60:42)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:4:12)\n    at SMSHomePage.getMessage (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\pageobjects\\metro\\SMSHomePage.js:54:16)\n    at UserContext.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:39:37)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\009a005e-006c-00a7-00ec-006600e900a5.png",
        "timestamp": 1571597696591,
        "duration": 19878
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "80b28b0903892f4943d0000a7c0374df",
        "instanceId": 15444,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: chrome not reachable\n  (Session info: chrome=77.0.3865.120)",
            "Failed: chrome not reachable\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "WebDriverError: chrome not reachable\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)",
            "WebDriverError: chrome not reachable\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:23:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571597795702,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571597795702,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.qa.metro-vendorcentral.com/vendor/client-api/v1/auth/userinfo?locale=en-US - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1571597804765,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js 0:580990 \"ERROR\" Error: Uncaught (in promise): Object: {\"headers\":{\"normalizedNames\":{},\"lazyUpdate\":null},\"status\":401,\"statusText\":\"OK\",\"url\":\"https://www.qa.metro-vendorcentral.com/vendor/client-api/v1/auth/userinfo?locale=en-US\",\"ok\":false,\"name\":\"HttpErrorResponse\",\"message\":\"Http failure response for https://www.qa.metro-vendorcentral.com/vendor/client-api/v1/auth/userinfo?locale=en-US: 401 OK\",\"error\":{\"message\":\"Authentication Required\"},\"extMessage\":\"\",\"extError\":401,\"extData\":null}\n    at M (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:14429)\n    at M (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:13987)\n    at https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:15252\n    at t.invokeTask (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:9171)\n    at Object.onInvokeTask (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/main.741ea2f90eeb2b6d9916.js:1:593051)\n    at t.invokeTask (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:9092)\n    at e.runTask (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:4349)\n    at g (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:11462)\n    at e.invokeTask [as invoke] (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:10307)\n    at m (https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com/polyfills.68311b0d62061e2af782.js:1:23786)",
                "timestamp": 1571597804765,
                "type": ""
            }
        ],
        "timestamp": 1571597758153,
        "duration": 96395
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "795c477c292e2aca44ec5189c7a17131",
        "instanceId": 24560,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, *[id=\"identifierId\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, *[id=\"identifierId\"])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\003d00d2-0041-00be-005b-006800150077.png",
        "timestamp": 1571597881475,
        "duration": 62174
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "efa5f3263b2eb8721f3043d282a733dd",
        "instanceId": 11956,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, *[id=\"identifierId\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, *[id=\"identifierId\"])\n    at elementArrayFinder.getWebElements.then (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:814:27)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as sendKeys] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:33:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "screenshots\\0098000e-00e7-00c0-009e-000700380048.png",
        "timestamp": 1571598019708,
        "duration": 63183
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "a50c7663d3e2a8d4a2b98945fe41834d",
        "instanceId": 10568,
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
                "timestamp": 1571598178534,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571598178534,
                "type": ""
            }
        ],
        "screenShotFile": "screenshots\\006600cf-0010-000f-008e-00490007004a.png",
        "timestamp": 1571598138824,
        "duration": 111183
    },
    {
        "description": "user can register|registration",
        "passed": false,
        "pending": false,
        "os": "windows nt",
        "sessionId": "7cc18cbc64b87c8686c22af907c9d6e5",
        "instanceId": 26204,
        "browser": {
            "name": "chrome",
            "version": "77.0.3865.120"
        },
        "message": [
            "Failed: no such window: target window already closed\nfrom unknown error: web view not found\n  (Session info: chrome=77.0.3865.120)",
            "Failed: no such window: target window already closed\nfrom unknown error: web view not found\n  (Session info: chrome=77.0.3865.120)"
        ],
        "trace": [
            "NoSuchWindowError: no such window: target window already closed\nfrom unknown error: web view not found\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:91:29)\n    at WebElement.(anonymous function).args [as click] (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\built\\element.js:831:22)\n    at WebElement.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\src\\wrappers\\WebElement.ts:21:20)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\src\\wrappers\\WebElement.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:23:5)\n    at addSpecsToSuite (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\test\\specs\\MetroSpecTests.ts:14:1)\n    at Module._compile (internal/modules/cjs/loader.js:778:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)\n    at Module.load (internal/modules/cjs/loader.js:653:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)",
            "NoSuchWindowError: no such window: target window already closed\nfrom unknown error: web view not found\n  (Session info: chrome=77.0.3865.120)\n    at Object.throwDecodedError (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\error.js:514:15)\n    at parseHttpResponse (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:519:13)\n    at doSend.then.response (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at process._tickCallback (internal/process/next_tick.js:68:7)\nFrom asynchronous test: \nError\n    at C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\protractor.conf.ts:23:9\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\sromankov\\WebstormProjects\\TypeScriptBasics\\build\\protractor.conf.js:5:58)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571598351230,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://mail.google.com/_/scs/mail-static/_/js/k=gmail.main.ru.DDUCoAX1JSg.O/am=X9HPQXhA8BK-7IwADhCMCjns_San0De5rC_BQ5Rc49fqQB8AAAAAAAAAAAAAAAAAAAD2oLES/d=1/exm=Av2a7c,CTcde,J03Die,M25vPb,MMhUM,MigGy,N35dyc,NVcOs,OIxRw,PZhDZb,PaBahd,Ps3HAc,Sz7W7c,Trl7bc,cs,cv,dFpypf,f,igbF5,it,kRtote,l,m_i,o2ajQe,pA5mjb,puPi7e,rMQdJc,rn4kU,spit,sps,t,to,uuoH9c,yWJZbc,zm225/ed=1/im=1/ct=zgms/rs=AHGWq9BXtHxNE8JZP8CDi6n5xBPSZB7D4Q/m=RI4GO,UZdBGe,VOAugd,YesRdb,kL0rjf,saV8oc,u7EXMd 48 Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://hangouts.google.com') does not match the recipient window's origin ('https://mail.google.com').",
                "timestamp": 1571598351230,
                "type": ""
            }
        ],
        "timestamp": 1571598311830,
        "duration": 97555
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
