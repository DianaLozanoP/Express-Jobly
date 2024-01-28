"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ExpressError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}
/**Middleware to ensure that only the admin is logged in
* 
* If not, return an error explaining must be an admin to make changes.
*/
function ensureAdmin(req, res, next) {
  //checked if user is logged in
  //checked that the logged in user is an admin
  try {
    if (!res.locals.user || !res.locals.user.isAdmin) {
      return next(new ExpressError("Must be admin to go acces this.", 401))
    }
    return next();
  }
  catch (err) {
    return next(err);
  }
}

function ensureOwnUserOrAdmin(req, res, next) {
  try {
    //Check if we have the user logged in
    if (!res.locals.user) {
      //if not logged in then return unauthorized error
      throw new UnauthorizedError();
    }
    //Check if the logged in user is the User of the params or it's an Admin
    if (res.locals.user.username !== req.params.username && !res.locals.user.isAdmin) {
      return next(new ExpressError("Unauthorized access. Only Admin or User Profile Owner can access."))
    }
    return next();
  }
  catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureOwnUserOrAdmin
};
