const {
  EventBooking,
  EventStatus,
  HALL_CAPACITIES,
} = require("../models/EventBooking");
const AppError = require("../../../middleware/error.middleware");

const VALID_STATUSES = new Set([
  "INQUIRY",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);
const VALID_PACKAGES = new Set(["STANDARD", "PREMIUM"]);
const PREMIUM_FEE = 10000;
const HALL_HOURLY_RATES = {
  'GRAND BALLROOM': 30000,
  'GARDEN PAVILION': 20000,
  'CONFERENCE ROOM': 10000,
  'MINI HALL': 12000,
};
const EMAIL_RE = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const MOBILE_RE = /^\d{10}$/;

class EventBookingService {
  async listBookings(userRole, username) {
    if (userRole === "CUSTOMER") {
      return await EventBooking.find({ createdByUsername: username }).sort({
        eventDateTime: -1,
      });
    }
    return await EventBooking.find().sort({ eventDateTime: -1 });
  }

  async createBooking(bookingData, username, userRole) {
    if (userRole === "CUSTOMER") {
      bookingData.createdByUsername = username;
      bookingData.status = "INQUIRY";
    } else if (!bookingData.createdByUsername) {
      bookingData.createdByUsername = username;
    }
    const prepared = await this._prepareForSave(bookingData, null, null);
    return await EventBooking.create(prepared);
  }

  async updateBooking(id, bookingData) {
    const existing = await EventBooking.findById(id);
    if (!existing) {
      throw new AppError("Event booking not found", 404);
    }

    const originalEventDateTime = existing.eventDateTime
      ? this._truncateToMinute(existing.eventDateTime)
      : null;

    const updated = {
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerMobile: bookingData.customerMobile,
      eventType: bookingData.eventType,
      hallName: bookingData.hallName,
      packageName: bookingData.packageName,
      eventDateTime: bookingData.eventDateTime,
      endDateTime: bookingData.endDateTime,
      attendees: bookingData.attendees,
      pricePerHour: bookingData.pricePerHour,
      pricePerGuest: bookingData.pricePerGuest,
      notes: bookingData.notes,
      status: bookingData.status || existing.status,
      createdByUsername: existing.createdByUsername,
    };

    const prepared = await this._prepareForSave(
      updated,
      id,
      originalEventDateTime,
    );
    return await EventBooking.findByIdAndUpdate(id, prepared, {
      new: true,
      runValidators: false,
    });
  }

  async deleteBooking(id) {
    const existing = await EventBooking.findById(id);
    if (!existing) {
      throw new AppError("Event booking not found", 404);
    }
    await EventBooking.findByIdAndDelete(id);
  }

  async getAnalytics() {
    const rows = await EventBooking.find();

    const byType = rows.reduce((acc, r) => {
      const type = r.eventType || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const popularTypes = Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const eventRevenue = rows.reduce((sum, r) => {
      const status = (r.status || "").toUpperCase();
      if (status !== "CONFIRMED" && status !== "COMPLETED") {
        return sum;
      }
      return sum + (r.totalPrice || r.totalCost || 0);
    }, 0);

    return {
      events: rows.length,
      eventRevenue,
      popularTypes,
    };
  }

  async _prepareForSave(booking, currentId, originalEventDateTime) {
    booking.customerName = this._requireText(
      booking.customerName,
      "Customer name is required",
    );
    booking.customerEmail = this._normalizeEmail(booking.customerEmail);
    booking.customerMobile = this._validateMobile(booking.customerMobile);
    booking.eventType = this._requireText(
      booking.eventType,
      "Event type is required",
    );
    booking.hallName = this._requireText(
      booking.hallName,
      "Hall name is required",
    );
    booking.packageName = this._validatePackage(booking.packageName);
    booking.status = this._validateStatus(booking.status);

    const eventDateTime = this._truncateToMinute(
      this._requireDateTime(
        booking.eventDateTime,
        "Starting date & time is required",
      ),
    );
    const endDateTime = this._truncateToMinute(
      this._requireDateTime(booking.endDateTime, "End date & time is required"),
    );

    this._validateEventStartNotInPast(eventDateTime, originalEventDateTime);
    this._validateDateRange(eventDateTime, endDateTime);

    if (!booking.attendees || booking.attendees <= 0) {
      throw new AppError("Attendees must be greater than 0", 400);
    }
    if (booking.pricePerHour == null || booking.pricePerHour < 0) {
      throw new AppError("Price per hour must be 0 or greater", 400);
    }
    this._validateHourlyRate(
      booking.hallName,
      booking.packageName,
      booking.pricePerHour,
    );

    this._validateHallCapacity(booking.hallName, booking.attendees);
    await this._ensureNoHallConflict(
      booking.hallName,
      eventDateTime,
      endDateTime,
      currentId,
    );

    const durationHours = this._calculateDurationHours(
      eventDateTime,
      endDateTime,
    );
    const totalPrice = this._calculateTotalPrice(
      booking.pricePerHour,
      durationHours,
      booking.packageName,
    );

    return {
      ...booking,
      eventDateTime,
      endDateTime,
      durationHours,
      totalPrice,
      totalCost: totalPrice,
    };
  }

  _normalizeEmail(email) {
    const normalized = this._requireText(
      email,
      "Customer email is required",
    ).toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      throw new AppError("Customer email must be a valid email address", 400);
    }
    return normalized;
  }

  _validateMobile(mobile) {
    const normalized = this._requireText(
      mobile,
      "Customer mobile number is required",
    );
    if (!MOBILE_RE.test(normalized)) {
      throw new AppError(
        "Customer mobile number must be exactly 10 digits",
        400,
      );
    }
    return normalized;
  }

  _validatePackage(packageName) {
    const normalized = this._requireText(
      packageName,
      "Package is required",
    ).toUpperCase();
    if (!VALID_PACKAGES.has(normalized)) {
      throw new AppError("Package must be Standard or Premium", 400);
    }
    return normalized.charAt(0) + normalized.slice(1).toLowerCase();
  }

  _validateStatus(status) {
    if (!status) return "INQUIRY";
    const normalized = status.toUpperCase();
    if (!VALID_STATUSES.has(normalized)) {
      throw new AppError("Invalid event status", 400);
    }
    return normalized;
  }

  _requireDateTime(value, message) {
    if (!value) throw new AppError(message, 400);
    return new Date(value);
  }

  _validateDateRange(start, end) {
    if (end <= start) {
      throw new AppError(
        "End date & time must be after starting date & time",
        400,
      );
    }
  }

  _getHourlyRate(hallName, packageName) {
    const normalizedHall = hallName ? hallName.trim().toUpperCase() : '';
    const hallRate = HALL_HOURLY_RATES[normalizedHall];
    if (hallRate == null) return null;
    return packageName && packageName.toUpperCase() === 'PREMIUM'
      ? hallRate + PREMIUM_FEE
      : hallRate;
  }

  _validateHourlyRate(hallName, packageName, pricePerHour) {
    const expected = this._getHourlyRate(hallName, packageName);
    if (expected == null) {
      throw new AppError("Invalid hall name or package selected", 400);
    }
    if (Math.round(pricePerHour * 100) / 100 !== expected) {
      throw new AppError(
        "Price per hour must match the selected hall package rate",
        400,
      );
    }
  }

  _validateEventStartNotInPast(start, originalEventDateTime) {
    const now = this._truncateToMinute(new Date());
    const isUnchanged =
      originalEventDateTime &&
      originalEventDateTime.getTime() === start.getTime();
    if (start < now && !isUnchanged) {
      throw new AppError("Starting date & time cannot be in the past", 400);
    }
  }

  _validateHallCapacity(hallName, attendees) {
    const capacity = HALL_CAPACITIES[hallName.trim().toUpperCase()];
    if (capacity && attendees > capacity) {
      throw new AppError(
        `Attendees cannot exceed selected hall capacity of ${capacity}.`,
        400,
      );
    }
  }

  async _ensureNoHallConflict(hallName, start, end, currentId) {
    const query = { hallName: { $regex: new RegExp(`^${hallName}$`, "i") } };
    if (currentId) {
      query._id = { $ne: currentId };
    }

    const existing = await EventBooking.find(query);
    const conflict = existing.some((row) => {
      if (row.status && row.status.toUpperCase() === "CANCELLED") return false;
      const existingStart = row.eventDateTime;
      const existingEnd = row.endDateTime || row.eventDateTime;
      if (!existingStart || !existingEnd) return false;
      return start < existingEnd && end > existingStart;
    });

    if (conflict) {
      throw new AppError(
        "Hall is already booked for the selected date & time range",
        400,
      );
    }
  }

  _calculateDurationHours(start, end) {
    const minutes = Math.round((end - start) / (1000 * 60));
    if (minutes <= 0) {
      throw new AppError("Duration must be greater than 0 minutes", 400);
    }
    return Math.round((minutes / 60) * 100) / 100;
  }

  _calculateTotalPrice(pricePerHour, durationHours, packageName) {
    let total = pricePerHour * durationHours;
    if (packageName && packageName.toUpperCase() === "PREMIUM") {
      total += PREMIUM_FEE;
    }
    return Math.round(total * 100) / 100;
  }

  _requireText(value, message) {
    if (!value || !value.trim()) throw new AppError(message, 400);
    return value.trim();
  }

  _truncateToMinute(date) {
    const d = new Date(date);
    d.setSeconds(0, 0);
    return d;
  }
}

module.exports = new EventBookingService();
