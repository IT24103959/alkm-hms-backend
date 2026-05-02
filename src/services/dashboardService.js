const User = require("../models/User");
const { Payroll } = require("../modules/user-payroll/models/Payroll");
const { Room } = require("../modules/room-management/models/Room");
const {
  RoomBooking,
} = require("../modules/room-management/models/RoomBooking");

const STAFF_ROLES = [
  "STAFF_MEMBER",
  "HOUSEKEEPER",
  "MAINTENANCE_STAFF",
  "RESTAURANT_MANAGER",
  "EVENT_MANAGER",
  "MANAGER",
];

class DashboardService {
  async getSummary() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalStaff,
      totalPayrollRecords,
      totalSalaryResult,
      totalRooms,
      roomBookings,
      roomBookingsLastMonth,
      totalRoomsLastMonth,
      mostBookedRooms,
      leastBookedRooms,
    ] = await Promise.all([
      User.countDocuments({ enabled: true, role: { $in: STAFF_ROLES } }),
      Payroll.countDocuments(),
      Payroll.aggregate([
        { $group: { _id: null, total: { $sum: "$netSalary" } } },
      ]),
      Room.countDocuments(),
      RoomBooking.countDocuments({
        createdAt: { $gte: startOfThisMonth },
      }),
      RoomBooking.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
      Room.countDocuments({ createdAt: { $lte: endOfLastMonth } }),
      RoomBooking.aggregate([
        { $group: { _id: "$roomNumber", bookings: { $sum: 1 } } },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
        {
          $project: {
            roomNumber: "$_id",
            bookings: 1,
            _id: 0,
          },
        },
      ]),
      RoomBooking.aggregate([
        { $group: { _id: "$roomNumber", bookings: { $sum: 1 } } },
        { $sort: { bookings: 1 } },
        { $limit: 5 },
        {
          $project: {
            roomNumber: "$_id",
            bookings: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    const totalSalaryPaid =
      totalSalaryResult.length > 0 ? totalSalaryResult[0].total : 0;

    const roomBookingsChangePercent =
      roomBookingsLastMonth > 0
        ? ((roomBookings - roomBookingsLastMonth) / roomBookingsLastMonth) * 100
        : 0;

    const totalRoomsChangePercent =
      totalRoomsLastMonth > 0
        ? ((totalRooms - totalRoomsLastMonth) / totalRoomsLastMonth) * 100
        : 0;

    return {
      totalStaff,
      totalSalaryPaid,
      totalPayrollRecords,
      totalRooms,
      roomBookings,
      totalRoomsChangePercent: Math.round(totalRoomsChangePercent * 100) / 100,
      roomBookingsChangePercent:
        Math.round(roomBookingsChangePercent * 100) / 100,
      mostBookedRooms,
      leastBookedRooms,
    };
  }
}

module.exports = new DashboardService();
