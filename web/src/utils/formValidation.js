/**
 * Form validation utilities
 * Provides validation functions for IC submission forms
 */

/**
 * Validate router data
 * @param {object} router - Router data object
 * @param {string} section - Section name (e.g., 'Tower End', 'Customer End')
 * @returns {Array} Array of error messages
 */
export const validateRouter = (router, section = '') => {
  const errors = [];
  const prefix = section ? `${section}: ` : '';

  if (!router?.routerType) {
    errors.push(`${prefix}Router type is required`);
  }

  if (router?.routerType && !router?.routerModel) {
    errors.push(`${prefix}Router model is required`);
  }

  if (!router?.serialNumber || router.serialNumber.trim() === '') {
    errors.push(`${prefix}Router serial number is required`);
  }

  if (!router?.images?.routerImages || router.images.routerImages.length < 2) {
    errors.push(`${prefix}At least 2 router images are required`);
  }

  if (!router?.images?.cableConnectivityImages || router.images.cableConnectivityImages.length < 2) {
    errors.push(`${prefix}At least 2 cable connectivity images are required`);
  }

  return errors;
};

/**
 * Validate radio data
 * @param {object} radio - Radio data object
 * @param {string} section - Section name (e.g., 'Tower End', 'Customer End')
 * @returns {Array} Array of error messages
 */
export const validateRadio = (radio, section = '') => {
  const errors = [];
  const prefix = section ? `${section}: ` : '';

  if (!radio?.radioType) {
    errors.push(`${prefix}Radio type is required`);
  }

  if (radio?.radioType === 'Mimosa' && !radio?.radioModel) {
    errors.push(`${prefix}Mimosa model is required`);
  }

  if (!radio?.serialNumber || radio.serialNumber.trim() === '') {
    errors.push(`${prefix}Radio serial number is required`);
  }

  if (!radio?.images || radio.images.length < 2) {
    errors.push(`${prefix}At least 2 radio images are required`);
  }

  if (radio?.images && radio.images.length > 4) {
    errors.push(`${prefix}Maximum 4 radio images allowed`);
  }

  // Validate LAN cable readings
  if (radio?.lanCableReading) {
    const start = parseFloat(radio.lanCableReading.start);
    const end = parseFloat(radio.lanCableReading.end);
    
    if (isNaN(start) || start < 0) {
      errors.push(`${prefix}LAN cable start reading must be a valid number`);
    }
    
    if (isNaN(end) || end < 0) {
      errors.push(`${prefix}LAN cable end reading must be a valid number`);
    }
    
    if (!isNaN(start) && !isNaN(end) && end < start) {
      errors.push(`${prefix}LAN cable end reading must be greater than or equal to start reading`);
    }
  }

  return errors;
};

/**
 * Validate IT rack data
 * @param {Array} racks - Array of IT rack objects
 * @param {string} section - Section name
 * @returns {Array} Array of error messages
 */
export const validateITRacks = (racks, section = '') => {
  const errors = [];
  const prefix = section ? `${section}: ` : '';

  if (!racks || racks.length === 0) {
    // IT racks are optional, so no error
    return errors;
  }

  racks.forEach((rack, index) => {
    if (!rack?.location || rack.location.trim() === '') {
      errors.push(`${prefix}IT Rack ${rack.rackNumber || index + 1}: Location is required`);
    }

    if (!rack?.images || rack.images.length < 2) {
      errors.push(`${prefix}IT Rack ${rack.rackNumber || index + 1}: At least 2 images are required`);
    }
  });

  return errors;
};

/**
 * Validate AP data
 * @param {Array} aps - Array of AP objects
 * @param {string} section - Section name
 * @returns {Array} Array of error messages
 */
export const validateAPs = (aps, section = '') => {
  const errors = [];
  const prefix = section ? `${section}: ` : '';

  if (!aps || aps.length === 0) {
    // APs are optional, so no error
    return errors;
  }

  aps.forEach((ap, index) => {
    if (!ap?.serialNumber || ap.serialNumber.trim() === '') {
      errors.push(`${prefix}AP ${ap.apNumber || index + 1}: Serial number is required`);
    }

    if (!ap?.images || ap.images.length < 2) {
      errors.push(`${prefix}AP ${ap.apNumber || index + 1}: At least 2 images are required`);
    }
  });

  return errors;
};

/**
 * Validate POE switch data
 * @param {Array} poeSwitches - Array of POE switch objects
 * @param {string} section - Section name
 * @returns {Array} Array of error messages
 */
export const validatePOESwitches = (poeSwitches, section = '') => {
  const errors = [];
  const prefix = section ? `${section}: ` : '';

  if (!poeSwitches || poeSwitches.length === 0) {
    // POE switches are optional, so no error
    return errors;
  }

  poeSwitches.forEach((poe, index) => {
    if (!poe?.serialNumber || poe.serialNumber.trim() === '') {
      errors.push(`${prefix}POE Switch ${poe.poeNumber || index + 1}: Serial number is required`);
    }

    if (!poe?.itRackNumber || poe.itRackNumber.toString().trim() === '') {
      errors.push(`${prefix}POE Switch ${poe.poeNumber || index + 1}: IT rack number is required`);
    }

    if (!poe?.location || poe.location.trim() === '') {
      errors.push(`${prefix}POE Switch ${poe.poeNumber || index + 1}: Location is required`);
    }

    if (!poe?.images || poe.images.length < 2) {
      errors.push(`${prefix}POE Switch ${poe.poeNumber || index + 1}: At least 2 images are required`);
    }
  });

  return errors;
};

/**
 * Validate complete form data (both tower and customer end)
 * @param {object} formData - Complete form data object
 * @returns {object} Object with errors array and isValid boolean
 */
export const validateFormData = (formData) => {
  const errors = [];

  // Tower End is optional - no validation required
  // If tower data exists, validate it, but don't require it
  if (formData.tower && (formData.tower.router || formData.tower.radio)) {
    // Only validate if some tower data is provided
    if (formData.tower.router) {
      errors.push(...validateRouter(formData.tower.router, 'Tower End'));
    }
    if (formData.tower.radio) {
      errors.push(...validateRadio(formData.tower.radio, 'Tower End'));
    }
  }

  // Validate Customer End (required)
  if (formData.customer) {
    errors.push(...validateRouter(formData.customer.router, 'Customer End'));
    errors.push(...validateRadio(formData.customer.radio, 'Customer End'));
    errors.push(...validateITRacks(formData.customer.itRacks, 'Customer End'));
    errors.push(...validateAPs(formData.customer.aps, 'Customer End'));
    errors.push(...validatePOESwitches(formData.customer.poeSwitches, 'Customer End'));
  } else {
    errors.push('Customer End data is required');
  }

  return {
    errors,
    isValid: errors.length === 0
  };
};

/**
 * Get field-specific error message
 * @param {string} fieldName - Name of the field
 * @param {object} errors - Array of all errors
 * @returns {string|null} Error message for the field or null
 */
export const getFieldError = (fieldName, errors) => {
  if (!errors || !Array.isArray(errors)) return null;
  
  const fieldError = errors.find(error => 
    error.toLowerCase().includes(fieldName.toLowerCase())
  );
  
  return fieldError || null;
};
