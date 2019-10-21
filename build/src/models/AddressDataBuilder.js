"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AddressDataBuilder {
    constructor(country) {
        this.addressData.country = country;
    }
    setPostalCode(postalCode) {
        this.addressData.postalCode = postalCode;
        return this;
    }
    setCity(city) {
        this.addressData.city = city;
    }
    setAddressLine1(addressLine1) {
        this.addressData.addressLine1 = addressLine1;
        return this;
    }
    setAddressLine2(addressLine2) {
        this.addressData.addressLine2 = addressLine2;
        return this;
    }
    setEmail(email) {
        this.addressData.email = email;
        return this;
    }
    setPhone(phone) {
        this.addressData.phone = phone;
        return this;
    }
    setFax(fax) {
        this.addressData.fax = fax;
        return this;
    }
    build() {
        return this.addressData;
    }
}
exports.AddressDataBuilder = AddressDataBuilder;
//# sourceMappingURL=AddressDataBuilder.js.map