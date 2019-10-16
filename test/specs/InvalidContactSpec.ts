import {browser, by, element, ElementFinder, ExpectedConditions as EC, protractor} from 'protractor';
import {Condition} from "../../src/helpers/Condition";

describe('adding a new contact with an invalid email', () => {

    let condition:Condition = new Condition();

    beforeEach(async () => {
        await browser.get('/#/');
        var EC = protractor.ExpectedConditions;

        await browser.wait( EC.urlContains(browser.baseUrl))
        expect(browser.getCurrentUrl())
            .toEqual(browser.baseUrl + '/#/');
        await condition.shouldBeClickable(element(by.id('add-contact')),10)
        await element(by.id('add-contact')).click();
        await condition.shouldBeVisible(element(by.css('#contact-name')),10)
        await element(by.id('contact-name')).sendKeys('Bad Email');
    });

    it('shouldn’t create a new contact with baduser.com', async () => {

        let email = element(by.id('contact-email'));
        condition.shouldBeVisible(<ElementFinder>email, 10);
        await email.sendKeys('baduser.com');
        condition.shouldBeClickable(element(by.buttonText('Create')), 10)
        element(by.buttonText('Create')).click();
        expect(browser.getCurrentUrl()).toEqual(
            browser.baseUrl + '/#/add');
    });
});