import { Event, Status, Response } from "./models/fetchHandsetModel";
import { handsetDataSchema } from "./models/fetchHandsetModelSchema";
import logger from "/opt/nodejs/logger/logger";
import { queryItems } from "/opt/nodejs/aws/dynamoDB";
import { QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { createPresignedUrlWithClient } from "./preSignedUrl";

/**
 * Function that fetches data from the DynamoDB table and validates it against the schema.
 * @param request - Connect input event with parameters
 * @returns {Response} - Response fetched from the DynamoDB or 404 if invalid/missing data
 */
export const fetchHandsetHandler = async (request: Event) => {
  const response: Response = {
    status: Status.SUCCESS,
    statusCode: 200
  };

  const bucketName = process.env.S3_BUCKET_NAME as string;
  const folderName = "buy-handset";

  try {
    const discoveryBrand = request.Details.Parameters.discoveryBrand;
    const discoveryNeed = request.Details.Parameters.discoveryNeed;
    const tableName = process.env.FETCH_HANDSET_TABLE_NAME;

    const requestParams: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression:
        "#discoveryBrand = :discoveryBrand AND #discoveryNeed = :discoveryNeed",
      ExpressionAttributeNames: {
        "#discoveryBrand": "DiscoveryBrand",
        "#discoveryNeed": "DiscoveryNeed"
      },
      ExpressionAttributeValues: {
        ":discoveryBrand": discoveryBrand,
        ":discoveryNeed": discoveryNeed
      }
    };

    const handsetData = await queryItems(requestParams);

    logger.debug(
      "fetchHandsetHandler:: dbData is: " + JSON.stringify(handsetData)
    );

    if (!handsetData.Items || handsetData.Items.length === 0) {
      logger.debug("fetchHandsetHandler:: Data not found in table");
      response.status = Status.FAILURE;
      response.statusCode = 404;
      response.message = "Data not found in table";
      return response;
    }

    const validation = handsetDataSchema.validate(handsetData.Items[0]);
    if (validation.error) {
      logger.debug(
        `fetchHandsetHandler:: Data validation failed: ${validation.error.message}`
      );
      response.status = Status.FAILURE;
      response.statusCode = 404;
      response.message = `Data validation failed: ${validation.error.message}`;

      return response;
    }

    const productOneS3ImageKey: string = `${folderName}/${handsetData.Items[0].ProductOneS3ImageKey}`;
    const productTwoS3ImageKey: string = `${folderName}/${handsetData.Items[0].ProductTwoS3ImageKey}`;

    const productOneImageUrl = await createPresignedUrlWithClient(
      bucketName,
      productOneS3ImageKey
    );
    const productTwoImageUrl = await createPresignedUrlWithClient(
      bucketName,
      productTwoS3ImageKey
    );

    const productOne = handsetData.Items[0].ProductOne;
    const productTwo = handsetData.Items[0].ProductTwo;

    const userName = request.Details.Parameters.userName;
    const O2B2C_S_JU_HDS_007 = request.Details.Parameters.O2B2C_S_JU_HDS_007;
    let O2B2C_S_JU_HDS_008 = request.Details.Parameters.O2B2C_S_JU_HDS_008;

    O2B2C_S_JU_HDS_008 = O2B2C_S_JU_HDS_008?.replace(
      "{productName}",
      `${productOne}\n${productTwo}`
    );

    const numberedOptions = O2B2C_S_JU_HDS_008?.split("\n")
      .map((option, index) => `${index + 1}. ${option}`)
      .join("\n");

    const whatsAppProductPrompt = `${O2B2C_S_JU_HDS_007?.replace(
      "{userName}",
      userName ?? "Visitor"
    )}\n${numberedOptions}`;

    response.productOne = productOne;
    response.productTwo = productTwo;

    response.productOneBasketUrl = handsetData.Items[0].ProductOneBasketUrl;
    response.productTwoBasketUrl = handsetData.Items[0].ProductTwoBasketUrl;
    response.productOneImageUrl = productOneImageUrl;
    response.productTwoImageUrl = productTwoImageUrl;
    response.handsetPrompt = handsetData.Items[0].ChooseOptionText;
    response.whatsAppProductPrompt = whatsAppProductPrompt;

    return response;
  } catch (error) {
    logger.error(`handler:: Error:${error}`);
    throw error;
  }
};
