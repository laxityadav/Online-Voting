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
const methodOverride = require('method-override');

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
app.use(methodOverride('_method'));
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

app.get('/ongoing', async (req, res) => {
    const allContest = await Vote.find({});
    res.render('ongoing', { allContest });
});

app.get('/result', async (req, res) => {
    const allContest = await Vote.find({});
    res.render('result', { allContest });
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

app.post('/voteform', async (req, res) => {
    req.body.duration = req.body.duration * 60000;

    const newVote = new Vote(req.body);
    newVote.endtime = new Date().getTime() + req.body.duration;
    await newVote.save();
    console.log(newVote);
    res.redirect(`/${newVote._id}`);
});

app.get('/:id', isLoggedIn, async (req, res) => {
    const vote = await Vote.findById(req.params.id);
    let date = new Date(vote.endtime - vote.duration);
    let user = await User.findById(req.user);
    let isVoted = false, winner = '';
    for (let v of user.voted) {
        if (v.voteId.toString() === vote._id.toString()) {
            isVoted = true;
            winner = v.votedName;
            break;
        }
    }
    res.render('contest', { vote, date, isVoted, winner });
});

app.put('/:id/:number', async (req, res) => {
    const { id, number } = req.params;
    const vote = await Vote.findById(id);
    let user = await User.findById(req.user);
    if (number === '1') {
        const increaseVote = await Vote.findByIdAndUpdate(id, { voteCount1: vote.voteCount1 + 1 });
        await increaseVote.save();
        user.voted.push({ voteId: vote._id, votedName: vote.candidate1 });
    } else {
        const increaseVote = await Vote.findByIdAndUpdate(id, { voteCount2: vote.voteCount2 + 1 });
        await increaseVote.save();
        user.voted.push({ voteId: vote._id, votedName: vote.candidate2 });
    }
    await user.save();
    res.redirect(`/${req.params.id}`);
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