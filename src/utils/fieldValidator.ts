/**
 * Validates an object.
 *
 * @param {*} obj object to validate
 * @param {*} fieldValidators list of fields and validators for each field
 */
export const validateObject = (obj: Record<string, any>, fieldValidators: any[]) => {
    const errors: any[] = [];
    const keys = Object.keys(obj);

    fieldValidators.forEach((val) => {
        if (keys.includes(val.field)) {
            const fieldErrors = val.validator(obj[val.field]);
            errors.push(...fieldErrors);
        } else {
            errors.push(val.field + ' is missing');
        }
    });

    return errors;
};

export const validateOptionalFields = (obj: Record<string, any>, fieldValidators: any[]) => {
    const errors = [];
    let someFieldPresent = false;
    const keys = Object.keys(obj);

    fieldValidators.forEach((val) => {
        if (keys.includes(val.field)) {
            someFieldPresent = true;

            const fieldErrors = val.validator(obj[val.field]);
            errors.push(...fieldErrors);
        }
    });

    if (!someFieldPresent) {
        errors.push('no fields are present');
    }

    return errors;
};
