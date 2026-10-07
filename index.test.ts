import { handler } from "../src/index";
import { fetchHandsetHandler } from "../src/fetchHandsetHandler";
import { Response, Status, Event } from "../src/models/fetchHandsetModel";

jest.mock("../src/fetchHandsetHandler", () => ({
  fetchHandsetHandler: jest.fn()
}));

describe("Handler Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return success response if the event is valid", async () => {
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
    const mockResponse: Response = {
      status: "Success",
      statusCode: 200,
      productOneImageUrl:
        "https://econtent.o2.co.uk/o/econtent/media/get/eb62f733-86ee-49e1-96c7-c4562de1ebad",
      productTwoImageUrl:
        "https://econtent.o2.co.uk/o/econtent/media/get/6b0d9c05-3b2e-4fe6-b763-0bd3a4894bd4",
      productOne: "iPhone-15",
      productTwo: "iPhone-15-Pro",
      productOneBasketUrl: "https://www.o2.co.uk/shop/Apple/iPhone-15",
      productTwoBasketUrl: "https://www.o2.co.uk/shop/Apple/iPhone-15-Pro"
    };

    const mockLambdaHandler = fetchHandsetHandler as jest.Mock;
    mockLambdaHandler.mockResolvedValue(mockResponse);

    const result = await handler(event);
    expect(result).toEqual(mockResponse);
  });

  it("should return failure if the event is invalid", async () => {
    const event: Event = {
      Details: {
        Parameters: {
          discoveryBrand: "Apple",
          discoveryNeed: "",
          userName: "User",
          O2B2C_S_JU_HDS_007: "Which handset would you prefer {userName}?",
          O2B2C_S_JU_HDS_008: "{productName}\nChoose again\nAsk a question"
        },
        ContactData: {
          ContactId: "76cf4490-98b2-4b3d-9868-9bf6447762ed"
        }
      }
    };
    const expectedErrorResponse = {
      statusCode: 500,
      status: Status.FAILURE,
      message: "One or more mandatory parameter values is missing or invalid."
    };
    const result = await handler(event);
    expect(result).toEqual(expectedErrorResponse);
  });

  it("should return failure if the processing fails", async () => {
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
    const errorMessage = "Internal Server Error";
    const expectedErrorResponse = {
      statusCode: 500,
      status: Status.FAILURE,
      message: errorMessage
    };

    const mockLambdaHandler = fetchHandsetHandler as jest.Mock;
    mockLambdaHandler.mockRejectedValue(new Error(errorMessage));
    const result = await handler(event);
    expect(result).toEqual(expectedErrorResponse);
  });
});
