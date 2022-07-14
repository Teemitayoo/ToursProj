module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); //Moves to global error middleware//error controller.js
  };
};
