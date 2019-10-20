import {browser} from "protractor";
export class LocalStorage {

    static getValue(key:string):any{
        return browser.executeScript("return window.localStorage.getItem('" + key + "');")
            .then((value)=> value);
    }

    static setKeyValue(key:string, value:string){
        browser.executeScript("return window.localStorage.setItem('"+key +"','"+value+"')")
    }

    static getLocalStorage(){
        return browser.executeScript("return window.localStorage;");
    }

    static clearLocalStorage(){
        browser.executeScript("return window.localStorage.clear();");
    }
}