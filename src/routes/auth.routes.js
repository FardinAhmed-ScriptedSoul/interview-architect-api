const {Router} = require('express')
const authControllers = require('../controllers/auth.controllers.js')
const {authMiddleware} = require('../middlewares/auth.middleware.js')
const authRouter = Router()


/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access public
 */


authRouter.post("/register",authControllers.registerUserController)

/**
 * @route POST /api/auth/login
 * @description logging in a registered user
 * @access public
 */

authRouter.post("/login",authControllers.loginUserController)

/**
 * @route POST /api/auth/logout
 * @description logging out a logged in user
 * @access public
 */

authRouter.post("/logout",authMiddleware,authControllers.logoutUserController)

/**
 * @route POST /api/auth/logout-all
 * @description logging out of all devices
 * @access public
 */

authRouter.post("/logout-all",authMiddleware,authControllers.logoutFromAllDevicesController)



module.exports = authRouter