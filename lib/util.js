function isPojo(obj) {
  if (obj === null || typeof obj !== 'object') {
    return false
  }
  return Object.getPrototypeOf(obj) === Object.prototype
}

module.exports = {
  isPojo
}
