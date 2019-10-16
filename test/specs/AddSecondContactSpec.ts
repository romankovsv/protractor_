import {browser, by, element, ExpectedConditions, protractor} from 'protractor';


describe('adding a new contact with name, email,' +
    'and phone number', () => {

    var EC = protractor.ExpectedConditions;

    beforeAll(async () => {
        await browser.get('/#/');
        await browser.wait(EC.elementToBeClickable(element(by.id('add-contact'))));
        await element(by.id('add-contact')).click();
        await browser.wait(ExpectedConditions.visibilityOf(element(by.css('#contact-name'))))
        await element(by.css('#contact-name')).sendKeys('Grace');
    });

    it('should type in an email address', async () => {
        let email = element(by.id('contact-email'));
        await email.sendKeys('grace@hopper.com');
        expect(email.getAttribute('value'))
            .toEqual('grace@hopper.com');
    });

    it('should type in a phone number', async () => {
        let tel = element(by.css('input[type="tel"]'));
        await tel.sendKeys('1234567890');
        expect(tel.getAttribute('value'))
            .toEqual('1234567890');
    })

    it('should click the create button', async () => {

        browser.wait(EC.visibilityOf(element(by.css('.create-button'))));
        await element(by.css('.create-button')).click();
        expect(browser.getCurrentUrl())
            .toEqual(browser.baseUrl + '/#/add');
    });

});