import {AddressData} from "./AddressData";

export class AddressDataBuilder {

    addressData:AddressData;

    constructor(country:string){
        this.addressData.country = country;
    }

    public setPostalCode(postalCode:string){
        this.addressData.postalCode = postalCode;
        return this;
    }

    public setCity(city:string){
        this.addressData.city = city;
    }

    public setAddressLine1(addressLine1:string){
        this.addressData.addressLine1 = addressLine1;
        return this;
    }

    public setAddressLine2(addressLine2:string){
        this.addressData.addressLine2 =addressLine2;
        return this;
    }

    public setEmail(email:string){
        this.addressData.email = email;
        return this;
    }

    public setPhone(phone:string){
        this.addressData.phone = phone;
        return this;
    }

    public setFax(fax:string){
        this.addressData.fax = fax;
        return this;
    }

    public build():AddressData{
        return this.addressData;
    }
}