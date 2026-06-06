const fs = require('fs');
const path = require('path');
function list(dir) {
  try {
    return fs.readdirSync(dir);
  } catch (e) {
    return e.message;
  }
}
console.log("=== root (/):", list('/'));
console.log("=== app (/app):", list('/app'));
console.log("=== workspace (/workspace):", list('/workspace'));
console.log("=== current path:", __dirname);
console.log("=== current files:", list('.'));
