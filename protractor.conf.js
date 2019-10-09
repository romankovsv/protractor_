

exports.config =  {
    framework: 'jasmine',
    capabilities: {
        browserName: 'chrome'
    },

    suites: {
        "first" : "./FirstTestSpec.js",
        "second" : "./SecondTestspec.js"
    },



    specs: [ './build/test/FirstTestSpec.js' ],
    seleniumAddress: 'http://localhost:7777/wd/hub',

    // You could set no globals to true to avoid jQuery '$' and protractor '$'
    // collisions on the global namespace.
    noGlobals: true
};
