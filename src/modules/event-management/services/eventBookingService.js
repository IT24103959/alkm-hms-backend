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
    const prepared = this._prepareForSave(bookingData, null, null);
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
      pricePerGuest: bookingData.pricePerGuest,
      notes: bookingData.notes,
      status: bookingData.status || existing.status,
      createdByUsername: existing.createdByUsername,
    };

    const prepared = this._prepareForSave(updated, id, originalEventDateTime);
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
      return sum + (r.totalPrice || r.totalCost || 0);
    }, 0);

    return {
      events: rows.length,
      eventRevenue,
      popularTypes,
    };
  }

  _prepareForSave(booking, currentId, originalEventDateTime) {
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
    if (booking.pricePerGuest == null || booking.pricePerGuest < 0) {
      throw new AppError("Price per guest must be 0 or greater", 400);
    }

    this._validateHallCapacity(booking.hallName, booking.attendees);
    this._ensureNoHallConflict(
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
      booking.pricePerGuest,
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
      "Package name is required",
    ).toUpperCase();
    if (!VALID_PACKAGES.has(normalized)) {
      throw new AppError("Package name must be Standard or Premium", 400);
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
        "Hall conflict detected for the selected time range",
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

  _calculateTotalPrice(pricePerGuest, durationHours, packageName) {
    let total = pricePerGuest * durationHours;
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