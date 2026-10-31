import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "@/features/onboarding/api/config";
import { server } from "./server";

export const NUMBER = "000000001";
export const OTHER_NUMBER = "000000002";
export const INVALID_MESSAGE = "Invalid Corporation Number";
export const UNAVAILABLE_MESSAGE =
  "We couldn't verify this number right now. Please click Submit to try again.";

export const validResponse = () =>
  HttpResponse.json({ corporationNumber: NUMBER, valid: true });
export const invalidResponse = () =>
  HttpResponse.json(
    { valid: false, message: "Invalid corporation number" },
    { status: 404 },
  );
export const serverErrorResponse = () =>
  new HttpResponse(null, { status: 500 });

/** Answers with `respond` and records the URL of every request received. */
export function mockCheck(
  respond: (number: string) => Response | Promise<Response>,
) {
  const requestedUrls: string[] = [];
  server.use(
    http.get(
      `${API_BASE_URL}/corporation-number/:number`,
      ({ request, params }) => {
        requestedUrls.push(request.url);
        return respond(String(params.number));
      },
    ),
  );
  return requestedUrls;
}
