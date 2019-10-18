import {ContactListPageObject} from "../../src/pageobjects/ContactListPageObject";
import {NewContactPageObject} from "../../src/pageobjects/NewContactPageObject";
import {browser} from 'protractor';
import {Log} from "../../src/helpers/Log";


describe('create new contact', () => {
    let contactList: ContactListPageObject;


    beforeEach(async () => {
        contactList = await new ContactListPageObject();
        await contactList.navigateTo();
    });

    it('should click the + button', async () => {
        Log.log().debug("In Test")
        let newContact: NewContactPageObject;
        newContact = await contactList.clickPlusButton();
        expect(await browser.getCurrentUrl())
            .toBe(browser.baseUrl + '/#/add');
    });

    it('should fill out form for a new contact', async () => {
        let newContact: NewContactPageObject;
        newContact = await contactList.clickPlusButton();
        await newContact.setContactInfo(
            'Mr. Newton', 'mr.newton@example.com', null);
        expect(await newContact.getName()).toBe('Mr. Newton');
        expect(await newContact.getEmail())
            .toBe('mr.newton@example.com');
        expect(await newContact.getPhone()).toBe('1');
    });


});
