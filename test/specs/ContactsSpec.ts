import { browser, ExpectedConditions,protractor } from 'protractor';


describe('your first protractor test',  () => {


    it('should load a page and verify the url', async() => {
        await browser.get('/#/');
        var EC = protractor.ExpectedConditions;

        await browser.wait( EC.urlContains(browser.baseUrl))
        expect(browser.getCurrentUrl())
            .toEqual(browser.baseUrl + '/#/');
    });
});