import { browser, by, element, ExpectedConditions } from 'protractor';
import {ContactListPageObject} from "../../src/pageobjects/ContactListPageObject";

describe('adding a new contact with only a name', () => {

    beforeEach(() => {
        browser.get('/#/');
    });


    var EC = ExpectedConditions;
    it('should find the add contact button',  async () => {
        await browser.wait( EC.elementToBeClickable(element(by.id('add-contact'))));
        await element(by.id('add-contact')).click();
        expect(browser.getCurrentUrl())
            .toEqual(browser.baseUrl + '/#/add');
    });

});