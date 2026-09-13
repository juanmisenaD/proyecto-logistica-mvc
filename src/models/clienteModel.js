const fs = require('fs');
const { PATHS } = require('../../config/constants');

class ClienteModel {
  static getAll() {
    try {
      if (!fs.existsSync(PATHS.CLIENTES)) return [];
      return JSON.parse(fs.readFileSync(PATHS.CLIENTES, 'utf8'));
    } catch {
      return [];
    }
  }

  static getByDni(dni) {
    const clientes = this.getAll();
    return clientes.find(c => Number(c.dni_nit) === Number(dni)) || null;
  }

  static saveOrUpdate(clienteData) {
    const clientes = this.getAll();
    const index = clientes.findIndex(c => Number(c.dni_nit) === Number(clienteData.dni_nit));
    
    if (index !== -1) {
      clientes[index] = { ...clientes[index], ...clienteData };
    } else {
      clientes.push(clienteData);
    }
    fs.writeFileSync(PATHS.CLIENTES, JSON.stringify(clientes, null, 2), 'utf8');
    return clienteData;
  }
}

module.exports = ClienteModel;