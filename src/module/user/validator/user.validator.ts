export const registerSchema = {
  validate(data: any) {
    if (!data) {
      return { error: { message: "Request payload is empty." } };
    }

    const { email, password, name, phone } = data;

    // Email validation
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return { error: { message: "A valid email address is required." } };
    }

    // Password validation
    if (!password || typeof password !== "string" || password.length < 6) {
      return { error: { message: "Password must be at least 6 characters long." } };
    }

    // Name validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return { error: { message: "Name cannot be empty." } };
    }

    // Optional phone validation
    if (phone && (typeof phone !== "string" || phone.trim().length < 10)) {
      return { error: { message: "Phone number must be at least 10 digits long." } };
    }

    return { value: data };
  },
};

export const loginSchema = {
  validate(data: any) {
    if (!data) {
      return { error: { message: "Request payload is empty." } };
    }

    const { email, password } = data;

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return { error: { message: "A valid email address is required to login." } };
    }

    if (!password || typeof password !== "string") {
      return { error: { message: "Password is required to login." } };
    }

    return { value: data };
  },
};

export const updateProfileSchema = {
  validate(data: any) {
    if (!data) {
      return { error: { message: "Request payload is empty." } };
    }

    const { name, phone, address, latitude, longitude, roles } = data;

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return { error: { message: "Name cannot be blank." } };
    }

    if (phone !== undefined && (typeof phone !== "string" || phone.trim().length < 10)) {
      return { error: { message: "Phone must be at least 10 characters long." } };
    }

    if (address !== undefined && typeof address !== "string") {
      return { error: { message: "Address must be a string." } };
    }

    if (latitude !== undefined && (typeof latitude !== "number" || isNaN(latitude))) {
      return { error: { message: "Latitude must be a valid float value." } };
    }

    if (longitude !== undefined && (typeof longitude !== "number" || isNaN(longitude))) {
      return { error: { message: "Longitude must be a valid float value." } };
    }

    // Validate roles array if sent
    if (roles !== undefined) {
      if (!Array.isArray(roles)) {
        return { error: { message: "Roles must be an array." } };
      }
      const validRoles = ["USER", "SELLER", "DOCTOR", "BREEDER", "VENDOR", "ADMIN"];
      const hasInvalidRole = roles.some((role) => !validRoles.includes(role));
      if (hasInvalidRole) {
        return { error: { message: `Roles must be subset of: [${validRoles.join(", ")}]` } };
      }
    }

    return { value: data };
  },
};
