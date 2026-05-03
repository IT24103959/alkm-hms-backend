function makeRoom(overrides = {}) {
    return {
        _id: "room-1",
        roomNumber: "101",
        roomType: "DELUXE",
        photoUrl: "https://example.com/room.jpg",
        roomDescription: "Sea view room",
        capacity: 2,
        totalRooms: 3,
        normalPrice: 100,
        weekendPrice: 150,
        seasonalPrice: null,
        roomStatus: "AVAILABLE",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        ...overrides,
    };
}

function makeBooking(overrides = {}) {
    return {
        _id: "booking-1",
        bookingCustomer: "Jane Doe",
        customerEmail: "jane@example.com",
        createdByUsername: "jane",
        roomNumber: "101",
        bookedRooms: 1,
        guestCount: 2,
        bookingStatus: "BOOKED",
        amount: 100,
        checkInDate: new Date("2026-05-04T00:00:00.000Z"),
        checkOutDate: new Date("2026-05-06T00:00:00.000Z"),
        room: {
            roomNumber: "101",
            roomType: "DELUXE",
            capacity: 2,
        },
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
        updatedAt: new Date("2026-01-04T00:00:00.000Z"),
        ...overrides,
    };
}

function createMockReq(overrides = {}) {
    return {
        headers: {},
        cookies: {},
        params: {},
        query: {},
        body: {},
        user: undefined,
        ...overrides,
    };
}

function createMockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function createMockNext() {
    return jest.fn();
}

module.exports = {
    makeRoom,
    makeBooking,
    createMockReq,
    createMockRes,
    createMockNext,
};
