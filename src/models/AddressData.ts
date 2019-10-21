
export class AddressData {

    country:string;
    postalCode:string;
    city:string;
    addressLine1:string;
    addressLine2:string;
    email:string;
    phone:string;
    fax:string;

    constructor(country:string){
        this.country = country;
    }
}