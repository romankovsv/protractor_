import {$, browser, protractor} from "protractor";
import matchers = require('jasmine-protractor-matchers')
import {HomePage} from "../../src/pageobjects/HomePage";
import {ProductFragmentPage} from "../../src/pageobjects/ProductFragmentPage";


describe("Rozetka Suite", async () => {


    it("Test rozetka search", async () => {
        console.log("Test on rozetka has been started");
        let homePage =  await new HomePage();
        await homePage.open();
        let productPage = await new ProductFragmentPage();
        await homePage.search("Apple");


    });




});
