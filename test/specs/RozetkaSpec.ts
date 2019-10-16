import {$, browser, protractor} from "protractor";
import matchers = require('jasmine-protractor-matchers')
import {HomePage} from "../../src/pageobjects/HomePage";
import {ProductFragmentPage} from "../../src/pageobjects/ProductFragmentPage";

describe("Suite", async () => {

    beforeEach(async () => {
        await new HomePage().open();
    });


    it("Test rozetka search", async () => {
        console.log("Test on rozetka has been started");
        let homePage = new HomePage();
        let productPage = new ProductFragmentPage();
       // await homePage.closeAdvert();
        await homePage.search("Apple");


    });




});
