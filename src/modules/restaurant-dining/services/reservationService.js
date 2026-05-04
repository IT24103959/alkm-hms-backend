const { Reservation, ReservationStatus } = require("../models/Reservation");
const AppError = require("../../../middleware/error.middleware");

class ReservationService {
  async create(reservationData, createdByUsername) {
    return await Reservation.create({ ...reservationData, createdByUsername });
  }

  async findAll() {
    return await Reservation.find().sort({
      reservationDate: -1,
      createdAt: -1,
    });
  }

  async findMine(createdByUsername) {
    return await Reservation.find({ createdByUsername }).sort({
      reservationDate: -1,
      createdAt: -1,
    });
  }

  async updateStatus(id, status) {
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }
    return reservation;
  }

  async assignTable(id, assignedTable) {
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { assignedTable },
      { new: true },
    );
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }
    return reservation;
  }

  async cancel(id) {
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new AppError("Reservation is already cancelled", 400);
    }
    reservation.status = ReservationStatus.CANCELLED;
    await reservation.save();
    return reservation;
  }
}

module.exports = new ReservationService();
