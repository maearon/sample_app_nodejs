import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import flash from 'connect-flash';
import helmet from 'helmet';
import xss from 'xss';
// import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import expressLayouts from 'express-ejs-layouts';
import config from './config/config.js';
import morgan from './config/morgan.js';
import { jwtStrategy } from './config/passport.js';
import { authLimiter } from './middlewares/rateLimiter.js';
import routes from './routes/index.js';
import { errorConverter, errorHandler } from './middlewares/error.js';
import { fullTitle, fullFlash } from './middlewares/appHelper.js';
import ApiError from './utils/ApiError.js';
import { safeMongoSanitize } from './middlewares/sanitize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// This allows us to pass data from the form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set Cookie Parser, sessions and flash
app.use(cookieParser('NotSoSecret'));
app.use(
  session({
    secret: 'something',
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
  }),
);
app.use(flash());

// view engine setup
app.set('view engine', 'ejs');

app.use(expressLayouts);
// Set custom default layout
app.set('layout', 'layouts/application');

// Serving static files in Express
app.use('/', express.static(path.join(__dirname, 'assets')));

app.set('views', path.join(__dirname, 'views'));

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
// app.use(xss());
app.use((req, res, next) => {
  req.body = xss(req.body);
  next();
});
// app.use(mongoSanitize());
app.use(safeMongoSanitize());

// gzip compression
app.use(compression());

// enable cors
// app.use(cors());
// app.options('*', cors());
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://maearon-todo-x.vercel.app'],
    credentials: true,
  }),
);

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.all('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);
app.use(fullTitle);
app.use(fullFlash);

// handle error
app.use(errorHandler);

export default app;
