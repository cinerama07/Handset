import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedUrlWithClient } from "../src/preSignedUrl";

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
  GetObjectCommand: jest.fn()
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn()
}));

describe("createPresignedUrlWithClient", () => {
  const bucket = "test-bucket";
  const key = "test-key";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a presigned URL with the given region, bucket, and key", async () => {
    const mockClient = {};
    const mockCommand = {};
    const mockUrl = "https://test-presigned-url.com";

    (S3Client as jest.Mock).mockReturnValue(mockClient);
    (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

    const result = await createPresignedUrlWithClient(bucket, key);

    expect(GetObjectCommand).toHaveBeenCalledWith({ Bucket: bucket, Key: key });
    expect(getSignedUrl).toHaveBeenCalledWith(mockClient, mockCommand, {
      expiresIn: 3600
    });
    expect(result).toBe(mockUrl);
  });

  it("should handle errors thrown during presigned URL generation", async () => {
    const mockError = new Error("Something went wrong");
    (S3Client as jest.Mock).mockReturnValue({});
    (getSignedUrl as jest.Mock).mockRejectedValue(mockError);

    await expect(createPresignedUrlWithClient(bucket, key)).rejects.toThrow(
      "Something went wrong"
    );
  });
});
