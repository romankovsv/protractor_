import { browser, by, element, ExpectedConditions } from 'protractor';
import {ContactListPageObject} from "../../src/pageobjects/ContactListPageObject";

describe('adding a new contact with only a name', function()  {

    beforeEach(async function() {
       await browser.get('/#/');
    });


    let EC = ExpectedConditions;
    it('should find the add contact button',  async function() {
        await browser.wait( EC.elementToBeClickable(element(by.id('add-contact'))));
        await element(by.id('add-contact')).click();
        expect(await browser.getCurrentUrl())
            .toEqual(browser.baseUrl + '/#/add');
    });

});