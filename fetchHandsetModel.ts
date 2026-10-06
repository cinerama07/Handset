export interface Event {
  Details: Details;
}

export interface Parameters {
  discoveryBrand: string;
  discoveryNeed: string;
  userName?: string;
  O2B2C_S_JU_HDS_007?: string;
  O2B2C_S_JU_HDS_008?: string;
}

export interface ContactData {
  ContactId: string;
}

export interface Details {
  Parameters: Parameters;
  ContactData: ContactData;
}

export interface CustomError {
  message: string;
  statusCode: string | number;
}

export interface Response {
  status: string;
  statusCode: number;
  productOne?: string;
  productTwo?: string;
  productOneImageUrl?: string;
  productTwoImageUrl?: string;
  productOneBasketUrl?: string;
  productTwoBasketUrl?: string;
  handsetPrompt?: string;
  message?: string;
  whatsAppProductPrompt?: string;
}

export enum Status {
  SUCCESS = "Success",
  FAILURE = "Failure"
}
