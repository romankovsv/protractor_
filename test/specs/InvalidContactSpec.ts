import {browser, by, element, ElementFinder, protractor} from 'protractor';
import {Condition} from "../../src/helpers/Condition";
import {Element} from "../../src/wrappers/Element";

describe('adding a new contact with an invalid email', () => {

    let condition: Condition = new Condition();

    beforeEach(async () => {
        await browser.get('/#/');
        let EC = protractor.ExpectedConditions;

        await browser.wait(EC.urlContains(browser.baseUrl))
        expect(browser.getCurrentUrl())
            .toEqual(browser.baseUrl + '/#/');


        let addContactButton: Element = await new Element(element(by.id('add-contact')));
        await addContactButton.customClick();

        let contactNameField: Element = await new Element(element(by.css('#contact-name')));
        await contactNameField.sendKeys('Bad Email');
    });

    it('shouldn’t create a new contact with baduser.com', async () => {

        let email = element(by.id('contact-email'));
        await condition.shouldBeVisible(<ElementFinder>email, 10);
        await email.sendKeys('baduser.com');
        await condition.shouldBeClickable(element(by.buttonText('Create')), 10)
        element(by.buttonText('Create')).click();
        expect(browser.getCurrentUrl()).toEqual(
            browser.baseUrl + '/#/add');
    });
});