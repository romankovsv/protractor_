import { browser, ExpectedConditions,protractor } from 'protractor';
const log4js = require('log4js');


describe('your first protractor test',  function()  {


    it('should load a page and verify the url', async function() {

        await browser.get('/#/');
        let EC = protractor.ExpectedConditions;

        await browser.wait( EC.urlContains(browser.baseUrl))
        expect(browser.getCurrentUrl())
            .toEqual(browser.baseUrl + '/#/');
    });
});