import {browser, ExpectedConditions as EC, By, ProtractorBrowser} from 'protractor'
import {Condition} from "../../src/helpers/Condition";

export class WebBrowser{

    private static instance:WebBrowser;
    browser:ProtractorBrowser

    private constructor(){
        this.browser = browser;
    }

    static getInstance(){
        if(!WebBrowser.instance){
            WebBrowser.instance = new WebBrowser();
        }
        return WebBrowser.instance;
    }
}