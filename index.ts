import { lambdaEventSchema } from "./models/fetchHandsetModelSchema";
import logger from "/opt/nodejs/logger/logger";
import { validate } from "/opt/nodejs/validator";
import { getErrorMessage } from "/opt/nodejs/utilityChecks";
import { Event, Status, CustomError } from "./models/fetchHandsetModel";
import { fetchHandsetHandler } from "./fetchHandsetHandler";

/* MAIN HANDLER */
export const handler = async function (event: Event) {
  try {
    const contactId = event.Details.ContactData.ContactId;
    logger.info(`handler:: contactId received is ${JSON.stringify(contactId)}`);
    validateInputEvent(event);
    logger.debug(`Request received: ${JSON.stringify(event)}`);
    const response = await fetchHandsetHandler(event);
    logger.debug(`Returning response: ${JSON.stringify(response)}`);
    return response;
  } catch (err) {
    const error = err as CustomError;
    logger.error(`Error processing Lex request:`, err);
    return {
      status: Status.FAILURE,
      message: error.message,
      statusCode: 500
    };
  }
};

function validateInputEvent(event: Event): void {
  const resp = validate(lambdaEventSchema, event);
  if (!resp.isValid) {
    logger.error(`index::Error:: ${getErrorMessage(resp.error)}`);
    throw new Error(
      "One or more mandatory parameter values is missing or invalid."
    );
  }
}
