const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/voteform', (req, res) => {
    res.render('voteform');
});

app.get('/abcd', (req, res) => {
    let countDownDate = new Date().getTime() + 60 * 1000;
    let now = new Date().getTime();
    let diff = countDownDate - now;

    setTimeout(() => {
        console.log('Backend is executed');
    }, diff);
});



app.listen(3000, () => {
    console.log('Listening on port 3000');
});