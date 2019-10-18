import {browser, by, element, ExpectedConditions, protractor} from 'protractor';
import {Condition} from "../../src/helpers/Condition";
import {Element} from "../../src/wrappers/Element";

describe('adding a new contact with name, email,' +
    'and phone number', () => {

    let EC = protractor.ExpectedConditions;
    let condition:Condition ;

    beforeEach(async () => {
        condition = new Condition();
        await browser.get('/#/');
        await browser.wait(EC.elementToBeClickable(element(by.id('add-contact'))));
        await element(by.id('add-contact')).click();
        await browser.wait(ExpectedConditions.visibilityOf(element(by.css('#contact-name'))))
        await element(by.css('#contact-name')).sendKeys('Grace');
    });

    it('should type in an email address', async () => {
        let email = element(by.id('contact-email'));
        await email.sendKeys('grace@hopper.com');
        expect(await email.getAttribute('value'))
            .toEqual('grace@hopper.com');
    });

    it('should type in a phone number', async () => {
        let tel = element(by.css('input[type="tel"]'));
        await tel.sendKeys('1234567890');
        expect(await tel.getAttribute('value'))
            .toEqual('1234567890');
    })



});