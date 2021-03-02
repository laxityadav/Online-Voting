const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const Vote = require('./models/vote');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');
const flash = require('connect-flash');
const catchAsync = require('./utils/catchAsync');

const { isLoggedIn } = require('./middleware');
const MongoDBStore = require('connect-mongo')(session);

const dbUrl = 'mongodb://localhost:27017/voting';
mongoose.connect(dbUrl, {
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
    console.log("Database Connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


const secret = 'thisissecret';

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("session store error", e);
});

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


//Routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/ongoing', (req, res) => {
    res.render('ongoing');
});

app.get('/result', (req, res) => {
    res.render('result');
});

app.get('/voteform', isLoggedIn, (req, res) => {
    res.render('voteform');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'welcome back!');
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});

app.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to online voting!');
            res.redirect('/');
        })
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('register');
    }
});

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/');
});

app.post('/voteform', isLoggedIn, async (req, res) => {
    const vote = new Vote(req.body);
    await vote.save();
    res.json({ vote });
});

app.get('/abcd', (req, res) => {
    let countDownDate = new Date().getTime() + 60 * 1000;
    let now = new Date().getTime();
    let diff = countDownDate - now;

    setTimeout(() => {
        console.log('Backend is executed');
    }, diff);
});


app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found, 400'));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong!';
    res.status(statusCode).render('error', { err });
});


app.listen(3000, () => {
    console.log('Listening on port 3000');
});