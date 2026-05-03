const { authorizeRoles } = require("../../../middleware/authorization.middleware");
const AppError = require("../../../middleware/error.middleware");
const { createMockReq, createMockNext } = require("./helpers");

describe("authorizeRoles", () => {
    it("allows a manager to access manager routes", () => {
        const middleware = authorizeRoles("SUPER_ADMIN", "MANAGER");
        const req = createMockReq({ user: { role: "MANAGER" } });
        const next = createMockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });

    it("rejects a staff user with 403", () => {
        const middleware = authorizeRoles("MANAGER");
        const req = createMockReq({ user: { role: "STAFF" } });
        const next = createMockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
        expect(next.mock.calls[0][0]).toMatchObject({
            message: "User role 'STAFF' is not authorized to access this route",
            statusCode: 403,
        });
    });

    it("rejects an unauthenticated request with 401", () => {
        const middleware = authorizeRoles("MANAGER");
        const req = createMockReq();
        const next = createMockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
        expect(next.mock.calls[0][0]).toMatchObject({
            message: "User not authenticated",
            statusCode: 401,
        });
    });
});
