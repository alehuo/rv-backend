import * as fieldValidator from './fieldValidator';

export const numericBarcode = (fieldname: string) => {
    return {
        field: fieldname,
        validator: (value: string) => {
            if (typeof value === 'string' && value.match(/^\d{1,14}$/)) {
                return [];
            } else {
                return [fieldname + ' should be a numeric 1-14 digit barcode'];
            }
        }
    };
};

export const string = (fieldname: string) => {
    return {
        field: fieldname,
        validator: (value: any) => {
            if (typeof value === 'string') {
                return [];
            } else {
                return [fieldname + ' should be a string'];
            }
        }
    };
};

export const nonEmptyString = (fieldname: string) => {
    return {
        field: fieldname,
        validator: (value: string | any[]) => {
            if (typeof value === 'string' && value.length > 0) {
                return [];
            } else {
                return [fieldname + ' should be a non-empty string'];
            }
        }
    };
};

export const integer = (fieldname: string) => {
    return {
        field: fieldname,
        validator: (value: unknown) => {
            if (typeof value === 'number' && Number.isInteger(value)) {
                return [];
            } else {
                return [fieldname + ' should be an integer'];
            }
        }
    };
};

export const positiveInteger = (fieldname: string) => {
    return {
        field: fieldname,
        validator: (value: unknown) => {
            if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
                return [];
            } else {
                return [fieldname + ' should be a positive integer'];
            }
        }
    };
};

export const nonNegativeInteger = (fieldname: string) => {
    return {
        field: fieldname,
        validator: (value: unknown) => {
            if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
                return [];
            } else {
                return [fieldname + ' should be a non-negative integer'];
            }
        }
    };
};

export const objectWithFields = (fieldname: string, fieldValidators: any[]) => {
    return {
        field: fieldname,
        validator: (value: null) => {
            if (typeof value === 'object' && value !== null) {
                return fieldValidator.validateObject(value, fieldValidators).map((err) => fieldname + ' ' + err);
            } else {
                return [fieldname + ' should be an object'];
            }
        }
    };
};

export const orNull = ({ field, validator }: any) => ({
    field,
    validator: (value: null) => (value === null ? [] : validator(value))
});
