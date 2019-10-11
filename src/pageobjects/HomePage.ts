import {BasePage} from "./BasePage";
import {protractor, $, browser} from "protractor";


export class HomePage extends BasePage{

    protected searchButton;
    protected searchField = $("input[name='search']");
    protected closeAdvertButton = $("span.exponea-close");


    constructor(){
        super();
        this.searchButton = $(".search-form .search-form__submit");
        let isClickable  = HomePage.EC.elementToBeClickable(this.searchButton);
        browser.wait(isClickable, 5000);
    }

    async search(item:string){
        await this.searchField.sendKeys(item);
        await this.searchButton.click();
    }

    async closeAdvert(){
        let isClickableSPan = await HomePage.EC.elementToBeClickable(this.closeAdvertButton);
        await browser.wait(isClickableSPan, 5000);
        await this.closeAdvertButton.click();
    }


}