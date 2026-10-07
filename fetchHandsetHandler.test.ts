import { fetchHandsetHandler } from "../src/fetchHandsetHandler";
import { Status, Event } from "../src/models/fetchHandsetModel";
import { queryItems } from "/opt/nodejs/aws/dynamoDB";
import { createPresignedUrlWithClient } from "../src/preSignedUrl";
import logger from "/opt/nodejs/logger/logger";

jest.mock("/opt/nodejs/logger/logger", () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

jest.mock("/opt/nodejs/aws/dynamoDB", () => ({
  queryItems: jest.fn()
}));

jest.mock("../src/preSignedUrl", () => ({
  createPresignedUrlWithClient: jest.fn()
}));

describe("fetchHandsetHandler Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve product information successfully", async () => {
    const event: Event = {
      Details: {
        Parameters: {
          discoveryBrand: "Apple",
          discoveryNeed: "Low",
          userName: "User",
          O2B2C_S_JU_HDS_007: "Which handset would you prefer {userName}?",
          O2B2C_S_JU_HDS_008: "{productName}\nChoose again\nAsk a question"
        },
        ContactData: {
          ContactId: "76cf4490-98b2-4b3d-9868-9bf6447762ed"
        }
      }
    };
    const mockResponse = {
      Items: [
        {
          ProductOne: "iPhone-15",
          ProductTwo: "iPhone-15-Pro",
          ProductOneBasketUrl: "https://www.o2.co.uk/shop/Apple/iPhone-15",
          ProductTwoBasketUrl: "https://www.o2.co.uk/shop/Apple/iPhone-15-Pro",
          ChooseOptionText: "Choose a handset",
          ProductOneS3ImageKey: "path/to/productOneImage.jpg",
          ProductTwoS3ImageKey: "path/to/productTwoImage.jpg"
        }
      ],
      $metadata: {}
    };

    (queryItems as jest.Mock).mockResolvedValue(mockResponse);
    (createPresignedUrlWithClient as jest.Mock)
      .mockResolvedValueOnce("https://s3.bucket.url/productOneImage.jpg")
      .mockResolvedValueOnce("https://s3.bucket.url/productTwoImage.jpg");

    const result = await fetchHandsetHandler(event);
    const expectedResponse = {
      status: Status.SUCCESS,
      statusCode: 200,
      productOne: "iPhone-15",
      productTwo: "iPhone-15-Pro",
      productOneBasketUrl: "https://www.o2.co.uk/shop/Apple/iPhone-15",
      productTwoBasketUrl: "https://www.o2.co.uk/shop/Apple/iPhone-15-Pro",
      productOneImageUrl: "https://s3.bucket.url/productOneImage.jpg",
      productTwoImageUrl: "https://s3.bucket.url/productTwoImage.jpg",
      handsetPrompt: "Choose a handset",
      whatsAppProductPrompt:
        "Which handset would you prefer User?\n1. iPhone-15\n2. iPhone-15-Pro\n3. Choose again\n4. Ask a question"
    };

    expect(result).toEqual(expectedResponse);
  });

  it("should handle no records found in the table", async () => {
    const event: Event = {
      Details: {
        Parameters: {
          discoveryBrand: "Samsung",
          discoveryNeed: "High",
          userName: "User",
          O2B2C_S_JU_HDS_007: "Which handset would you prefer {userName}?",
          O2B2C_S_JU_HDS_008: "{productName}\nChoose again\nAsk a question"
        },
        ContactData: {
          ContactId: "76cf4490-98b2-4b3d-9868-9bf6447762ed"
        }
      }
    };
    const mockResponse = {
      Items: [],
      $metadata: {}
    };

    (queryItems as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchHandsetHandler(event);
    const expectedResponse = {
      status: Status.FAILURE,
      statusCode: 404,
      message: "Data not found in table"
    };

    expect(result).toEqual(expectedResponse);
  });

  it("should handle error when querying the database", async () => {
    const event: Event = {
      Details: {
        Parameters: {
          discoveryBrand: "Apple",
          discoveryNeed: "Low",
          userName: "User",
          O2B2C_S_JU_HDS_007: "Which handset would you prefer {userName}?",
          O2B2C_S_JU_HDS_008: "{productName}\nChoose again\nAsk a question"
        },
        ContactData: {
          ContactId: "76cf4490-98b2-4b3d-9868-9bf6447762ed"
        }
      }
    };
    const errorMessage = "Database Error";

    (queryItems as jest.Mock).mockRejectedValue(new Error(errorMessage));

    try {
      await fetchHandsetHandler(event);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toBe(errorMessage);
      } else {
        throw new Error("Unexpected error type");
      }
    }
  });

  it("should handle error while generating presigned URL", async () => {
    const event: Event = {
      Details: {
        Parameters: {
          discoveryBrand: "Apple",
          discoveryNeed: "Low",
          userName: "User",
          O2B2C_S_JU_HDS_007: "Which handset would you prefer {userName}?",
          O2B2C_S_JU_HDS_008: "{productName}\nChoose again\nAsk a question"
        },
        ContactData: {
          ContactId: "76cf4490-98b2-4b3d-9868-9bf6447762ed"
        }
      }
    };

    const mockResponse = {
      Items: [
        {
          ProductOne: "iPhone-15",
          ProductTwo: "iPhone-15-Pro",
          ProductOneBasketUrl: "https://www.o2.co.uk/shop/Apple/iPhone-15",
          ProductTwoBasketUrl: "https://www.o2.co.uk/shop/Apple/iPhone-15-Pro",
          ChooseOptionText: "Choose a handset",
          ProductOneS3ImageKey: "path/to/productOneImage.jpg",
          ProductTwoS3ImageKey: "path/to/productTwoImage.jpg"
        }
      ],
      $metadata: {}
    };

    (queryItems as jest.Mock).mockResolvedValue(mockResponse);
    (createPresignedUrlWithClient as jest.Mock)
      .mockResolvedValueOnce("https://s3.bucket.url/productOneImage.jpg")
      .mockRejectedValueOnce(new Error("Failed to generate presigned URL"));

    try {
      await fetchHandsetHandler(event);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toBe("Failed to generate presigned URL");
      } else {
        throw new Error("Unexpected error type");
      }
    }
  });
  it("should handle validation error on fetched DynamoDB items", async () => {
    const event: Event = {
      Details: {
        Parameters: {
          discoveryBrand: "Apple",
          discoveryNeed: "Low",
          userName: "User",
          O2B2C_S_JU_HDS_007: "Which handset would you prefer {userName}?",
          O2B2C_S_JU_HDS_008: "{productName}\nChoose again\nAsk a question"
        },
        ContactData: {
          ContactId: "76cf4490-09b2-4b3d-9868-9bf6049962ed"
        }
      }
    };

    const mockInvalidItems = {
      Items: [{}],
      $metadata: {}
    };

    (queryItems as jest.Mock).mockResolvedValue(mockInvalidItems);

    const result = await fetchHandsetHandler(event);

    const expectedResponse = {
      status: Status.FAILURE,
      statusCode: 404,
      message: 'Data validation failed: "ProductOne" is required'
    };

    expect(result).toEqual(expectedResponse);
    expect(logger.debug).toHaveBeenCalledWith(
      `fetchHandsetHandler:: Data validation failed: "ProductOne" is required`
    );
  });
});
