import joi from "joi";

export const lambdaParametersSchema = joi
  .object()
  .keys({
    discoveryBrand: joi.string().required(),
    discoveryNeed: joi.string().required()
  })
  .options({ allowUnknown: true });
export const contactDataSchema = joi
  .object()
  .keys({
    ContactId: joi.string().required()
  })
  .options({ allowUnknown: true });

export const lambdaDetailsSchema = joi
  .object()
  .keys({
    Parameters: lambdaParametersSchema.required(),
    ContactData: contactDataSchema.required()
  })
  .options({ allowUnknown: true });

export const lambdaEventSchema = joi
  .object()
  .keys({
    Details: lambdaDetailsSchema.required()
  })
  .options({ allowUnknown: true });

export const handsetDataSchema = joi
  .object()
  .keys({
    ProductOne: joi.string().required(),
    ProductTwo: joi.string().required(),
    ProductOneBasketUrl: joi.string().required(),
    ProductTwoBasketUrl: joi.string().required(),
    ProductOneS3ImageKey: joi.string().required(),
    ProductTwoS3ImageKey: joi.string().required(),
    ChooseOptionText: joi.string().required()
  })
  .options({ allowUnknown: true });
