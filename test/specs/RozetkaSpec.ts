import {$, browser, protractor} from "protractor";
import matchers = require('jasmine-protractor-matchers')
import {HomePage} from "../../src/pageobjects/HomePage";
import {ProductFragmentPage} from "../../src/pageobjects/ProductFragmentPage";


describe("Rozetka Suite", async function()  {



    it("Test rozetka search", async function() {

        await console.log("Test on rozetka has been started");
        let homePage =  await new HomePage();
        await homePage.open();
        let productPage = await new ProductFragmentPage();
        await homePage.search("Apple");

    });




});
