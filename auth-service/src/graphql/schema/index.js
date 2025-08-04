const permissionSchema = require('./types/permission');
const roleSchema = require('./types/role');
// const userSchema = require('./types/user');


module.exports = `
  ${roleSchema}
  ${permissionSchema}
`;