const fs = require('fs');
const { PATHS } = require('../../config/constants');

class NationModel {
  static getUbicaciones() {
    try {
      if (!fs.existsSync(PATHS.NATION)) return {};
      return JSON.parse(fs.readFileSync(PATHS.NATION, 'utf8'));
    } catch {
      return {};
    }
  }
}

module.exports = NationModel;